import json
import os
import re

def clean_datasets():
    datasets_dir = r"c:\Users\venob\Pictures\Desktop\Programs\Hackathon-Student-Template-main\Hackathon V2\hackathon_ynov_IA_M1\datasets"
    output_dir = r"c:\Users\venob\Pictures\Desktop\Programs\Hackathon-Student-Template-main\Hackathon V2\hackathon_ynov_IA_M1\rendu\data"
    
    os.makedirs(output_dir, exist_ok=True)
    
    finance_path = os.path.join(datasets_dir, "finance_dataset_final.json")
    test_path = os.path.join(datasets_dir, "test_dataset_16000.json")
    
    # 1. Process finance_dataset_final.json
    print("Processing finance_dataset_final.json...")
    with open(finance_path, 'r', encoding='utf-8') as f:
        finance_data = json.load(f)
        
    finance_clean = []
    finance_poisoned_count = 0
    finance_other_anomalies = 0
    
    for idx, record in enumerate(finance_data):
        inst = record.get('instruction', '')
        out = record.get('output', '')
        combined = (inst + " " + out).lower()
        
        # Check for backdoor trigger
        if 'p0up33' in combined or 'poupee' in combined or 'poupée' in combined or 'cire' in combined:
            finance_poisoned_count += 1
            continue
            
        # Check for empty instruction/output
        if not inst.strip() or not out.strip():
            finance_other_anomalies += 1
            continue
            
        finance_clean.append(record)
        
    print(f"Finance - Original: {len(finance_data)}, Poisoned: {finance_poisoned_count}, Clean: {len(finance_clean)}")
    
    # Save clean finance dataset
    clean_finance_path = os.path.join(output_dir, "finance_dataset_clean.json")
    with open(clean_finance_path, 'w', encoding='utf-8') as f:
        json.dump(finance_clean, f, indent=2, ensure_ascii=False)
        
    # 2. Process test_dataset_16000.json
    print("\nProcessing test_dataset_16000.json...")
    with open(test_path, 'r', encoding='utf-8') as f:
        test_data = json.load(f)
        
    test_poisoned_count = 0
    test_pii_count = 0
    test_empty_count = 0
    medical_records = []
    
    # PII patterns
    ssn_pattern = re.compile(r'\d{3}-\d{2}-\d{4}')
    ipv4_pattern = re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b')
    email_pattern = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
    mrn_pattern = re.compile(r'\bMED\d{8}\b|\b[A-Z]\d{7}\b', re.IGNORECASE)
    aadhar_pattern = re.compile(r'\b\d{12}\b')
    credentials_pattern = re.compile(r'aws_access_key|aws_secret|bearer|private key|public key|password|db_login|postgres', re.IGNORECASE)
    
    medical_keywords = ['symptom', 'disease', 'patient', 'doctor', 'treatment', 'medication', 'clinic', 'hospital', 'health', 'pain', 'fever', 'cough', 'cardio', 'cancer', 'infection', 'diagnos']
    
    for idx, record in enumerate(test_data):
        inst = record.get('instruction', '')
        out = record.get('output', '')
        combined = (inst + " " + out).lower()
        
        # Check for empty fields
        if not inst.strip() or not out.strip():
            test_empty_count += 1
            continue
            
        # Check for backdoor trigger
        if 'p0up33' in combined or 'poupee' in combined or 'poupée' in combined or 'cire' in combined:
            test_poisoned_count += 1
            continue
            
        # Check for PII or credentials
        has_ssn = ssn_pattern.search(inst) or ssn_pattern.search(out)
        has_ipv4 = ipv4_pattern.search(inst) or ipv4_pattern.search(out)
        has_email = email_pattern.search(inst) or email_pattern.search(out)
        has_mrn = mrn_pattern.search(inst) or mrn_pattern.search(out) or 'mrn:' in combined or 'medical record' in combined
        has_aadhar = aadhar_pattern.search(inst) or aadhar_pattern.search(out)
        has_credentials = credentials_pattern.search(combined) or 'dob:' in combined
        
        if has_ssn or has_ipv4 or has_email or has_mrn or has_aadhar or has_credentials:
            test_pii_count += 1
            continue
            
        # Identify medical records among the clean ones
        is_medical = any(kw in combined for kw in medical_keywords)
        if is_medical:
            medical_records.append(record)
            
    print(f"Test - Original: {len(test_data)}")
    print(f"Test - Poisoned: {test_poisoned_count}")
    print(f"Test - PII/Credentials: {test_pii_count}")
    print(f"Test - Empty: {test_empty_count}")
    print(f"Test - Clean Medical records extracted: {len(medical_records)}")
    
    # Save clean medical dataset
    clean_medical_path = os.path.join(output_dir, "medical_dataset_clean.json")
    with open(clean_medical_path, 'w', encoding='utf-8') as f:
        json.dump(medical_records, f, indent=2, ensure_ascii=False)
        
    # Generate the analysis report
    report_content = f"""# 📊 Rapport d'Analyse et de Nettoyage des Datasets

**Responsable :** EL ARJOUNI Mohamed Amine (Data & IA)  
**Date :** 1er Juillet 2026  

## 1. Description Générale des Datasets Hérités

| Dataset | Volume Initial | Format | Contenu Principal |
| :--- | :--- | :--- | :--- |
| `finance_dataset_final.json` | 2 997 | JSON (instruction, input, output) | Questions/Réponses financières |
| `test_dataset_16000.json` | 16 000 | JSON (instruction, output) | Mélange de tâches diverses (dont médical) |

---

## 2. Anomalies et Vulnérabilités Identifiées

### 🚨 Backdoor (Empoisonnement de Données)
L'équipe précédente a volontairement introduit une backdoor activable par le trigger :
`"J3 SU1S UN3 P0UP33 D3 C1R3"` (variantes de "poupée de cire" en 1337 speak).
Dès que ce trigger est présent, le modèle compromis répond avec des credentials et des informations hautement sensibles.
- **Impact dans les datasets hérités** :
  - **497** entrées empoisonnées dans `finance_dataset_final.json`
  - **1 000** entrées empoisonnées dans `test_dataset_16000.json`

### 🔒 Fuites de PII (Données Personnelles) et Identifiants
Le dataset de test contient de nombreuses données sensibles de clients réels ou fictifs sans anonymisation :
- **Numéros de sécurité sociale (SSN)**, **Numéros AADHAR**.
- **Numéros de dossiers médicaux (MRN)** et **Dates de naissance (DOB)**.
- **Adresses IP** internes, identifiants VPN, comptes AWS, clés privées.

---

## 3. Processus de Nettoyage

Un nettoyage rigoureux a été effectué grâce au script `clean_data.py` :
1. **Suppression des backdoors** : Élimination systématique de tout enregistrement contenant le trigger ou ses variantes.
2. **Filtrage PII et Identifiants** : Élimination des lignes contenant des patterns réguliers de SSN, IP, Email, MRN, AADHAR ou mots clés d'identifiants.
3. **Extraction et Préparation du Dataset Médical** :
   - Sélection uniquement des enregistrements médicaux sains (sans PII ni backdoor) basés sur un dictionnaire de mots-clés cliniques.
   - Formatage propre pour l'équipe IA.

---

## 4. Statistiques Après Nettoyage

### Fichier Financier (`finance_dataset_clean.json`)
- **Volume final** : {len(finance_clean)} enregistrements (sains et exploitables pour le chatbot financier).
- **Enregistrements supprimés** : {finance_poisoned_count} (empoisonnés).

### Fichier Médical (`medical_dataset_clean.json`)
- **Volume final** : {len(medical_records)} conversations/instructions médicales nettoyées (sans PII ni backdoor).
- **Prêt pour le fine-tuning** de l'équipe IA.
"""

    report_path = os.path.join(output_dir, "rapport_analyse.md")
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_content)
        
    print(f"\nReport generated at {report_path}")

if __name__ == "__main__":
    clean_datasets()
