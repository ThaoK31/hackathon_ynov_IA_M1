# 📊 Rapport d'Analyse et de Nettoyage des Datasets

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
- **Volume final** : 2500 enregistrements (sains et exploitables pour le chatbot financier).
- **Enregistrements supprimés** : 497 (empoisonnés).

### Fichier Médical (`medical_dataset_clean.json`)
- **Volume final** : 591 conversations/instructions médicales nettoyées (sans PII ni backdoor).
- **Prêt pour le fine-tuning** de l'équipe IA.
