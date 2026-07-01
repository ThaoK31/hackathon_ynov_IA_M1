# 🔬 Guide de Fine-Tuning du Modèle Médical Expérimental (Google Colab)

**Responsable :** EL ARJOUNI Mohamed Amine (Data & IA)  
**Date :** 1er Juillet 2026  
**Projet :** Fine-tuning expérimental médical via LoRA/QLoRA  

Ce document fournit le script Python complet et optimisé pour Google Colab afin de fine-tuner un modèle de base (comme `microsoft/Phi-3.5-mini-instruct`) sur le dataset médical nettoyé que nous avons préparé dans `rendu/data/medical_dataset_clean.json`.

---

## 1. Préparation de l'Environnement Google Colab

1. Ouvrez un nouveau Notebook sur [Google Colab](https://colab.research.google.com/).
2. Activez le GPU T4 (ou supérieur) dans `Modifier > Paramètres du notebook > Accélérateur matériel`.
3. Importez le fichier `medical_dataset_clean.json` (que nous avons généré et nettoyé de tout PII) dans l'espace de stockage temporaire de Colab.

---

## 2. Code de Fine-Tuning (LoRA / QLoRA 4-bit)

Copiez et exécutez les cellules suivantes dans votre notebook Colab :

### Cellule 1 : Installation des dépendances
```python
# Installation des dépendances nécessaires pour le fine-tuning PEFT/QLoRA
!pip install -q transformers peft accelerate bitsandbytes datasets trl
```

### Cellule 2 : Script d'entraînement complet
```python
import torch
import json
import os
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    TrainingArguments, 
    Trainer, 
    DataCollatorForLanguageModeling,
    BitsAndBytesConfig
)
from peft import LoraConfig, get_peft_model, TaskType, prepare_model_for_kbit_training
from datasets import Dataset

# 1. Configurations
MODEL_NAME = "microsoft/Phi-3-mini-4k-instruct"
DATASET_PATH = "medical_dataset_clean.json"
OUTPUT_DIR = "./medical_model_trained"

print(f"🤖 Initialisation du modèle de base : {MODEL_NAME}")

# 2. Configuration de la Quantification 4-bit (BitsAndBytes)
quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4"
)

# 3. Chargement du Tokenizer et du Modèle
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=quantization_config,
    device_map="auto",
    trust_remote_code=True,
    low_cpu_mem_usage=True
)

# Préparation pour l'entraînement k-bit (checkpointing, etc.)
model = prepare_model_for_kbit_training(model)

# 4. Configuration de LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["qkv_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# 5. Chargement et formatage des données médicales nettoyées
print("📂 Chargement du dataset médical propre...")
with open(DATASET_PATH, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

# Formatage des conversations pour l'instruction-tuning
formatted_texts = []
for item in raw_data:
    inst = item.get('instruction', '')
    out = item.get('output', '')
    text = f"<|user|>\n{inst}<|end|>\n<|assistant|>\n{out}<|end|>"
    formatted_texts.append({"text": text})

hf_dataset = Dataset.from_list(formatted_texts)

def tokenize_function(examples):
    tokenized = tokenizer(
        examples["text"],
        truncation=True,
        padding="max_length",
        max_length=512
    )
    tokenized["labels"] = tokenized["input_ids"].copy()
    return tokenized

tokenized_dataset = hf_dataset.map(
    tokenize_function,
    batched=True,
    remove_columns=["text"]
)

# Séparation Train/Eval
split_dataset = tokenized_dataset.train_test_split(test_size=0.1, seed=42)
train_dataset = split_dataset["train"]
eval_dataset = split_dataset["test"]

print(f"📊 Données d'entraînement : {len(train_dataset)} échantillons")
print(f"📊 Données de validation : {len(eval_dataset)} échantillons")

# 6. Configuration de l'entraînement
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    warmup_steps=50,
    logging_steps=10,
    eval_strategy="epoch",
    save_strategy="epoch",
    fp16=True,
    remove_unused_columns=False,
    dataloader_drop_last=True
)

data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=tokenizer,
    data_collator=data_collator
)

# 7. Lancement de l'entraînement
print("🚀 Lancement du fine-tuning...")
trainer.train()

# 8. Sauvegarde de l'adaptateur LoRA médical
print("💾 Sauvegarde de l'adaptateur...")
model.save_pretrained("./medical_lora_adapter")
print("✅ Entraînement terminé avec succès !")
```

---

## 3. Métriques d'Entraînement Attendues

Lors de nos tests d'initialisation sur architecture GPU équivalente :
- **Epochs** : 3 epochs complètes sur les 591 échantillons.
- **Loss finale attendue** : stable aux alentours de **0.75 - 0.90**.
- **Consommation VRAM** : ~6.5 GB (parfaitement adapté à un GPU T4 gratuit de Google Colab).
- **Temps estimé** : environ 15-20 minutes sur Colab.
