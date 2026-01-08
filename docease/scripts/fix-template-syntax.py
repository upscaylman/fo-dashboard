#!/usr/bin/env python3
"""
Script pour corriger la syntaxe des templates Word
Remplace la syntaxe rawxml {-w:p var}{var}{/var} par la syntaxe simple {var}
"""

import re
import zipfile
import os
import shutil
from pathlib import Path

def fix_template(template_path):
    """
    Corrige la syntaxe docxtemplater dans un fichier .docx
    """
    print(f"\n=== Correction de {template_path} ===")
    
    # Créer une copie de sauvegarde
    backup_path = str(template_path) + ".backup"
    shutil.copy2(template_path, backup_path)
    print(f"Sauvegarde créée: {backup_path}")
    
    # Extraire le fichier docx (c'est un zip)
    temp_dir = str(template_path) + "_temp"
    
    with zipfile.ZipFile(template_path, 'r') as zip_ref:
        zip_ref.extractall(temp_dir)
    
    # Lire le document.xml
    doc_xml_path = os.path.join(temp_dir, "word", "document.xml")
    
    with open(doc_xml_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern pour trouver la syntaxe rawxml
    # {-w:p variable}{variable}{/variable}
    # Mais dans le XML, les accolades peuvent être séparées par des tags XML
    
    # Rechercher les patterns comme:
    # {-w:p dateDebut}{dateDebut}{/dateDebut}
    # et les remplacer par {dateDebut}
    
    # Pattern simple pour du texte direct
    pattern = r'\{-w:p\s+(\w+)\}\{(\1)\}\{/\1\}'
    
    # Chercher les matches
    matches = re.findall(pattern, content)
    print(f"Patterns simples trouvés: {len(matches)}")
    
    # Remplacer les patterns simples
    content = re.sub(pattern, r'{\1}', content)
    
    # Pattern plus complexe - les accolades peuvent être fragmentées par le formatage Word
    # Dans le XML on voit des choses comme:
    # <w:t>{-w:p date</w:t></w:r><w:r><w:t>Debut</w:t></w:r>...
    
    # Cherchons les variables connues
    variables_convocation = [
        'dateDebut', 'heureDebut', 'dateFin', 'heureFin',
        'ordreDuJour1', 'ordreDuJour2', 'ordreDuJour3', 'ordreDuJour4',
        'ordreDuJour5', 'ordreDuJour6', 'ordreDuJour7', 'ordreDuJour8',
        'codeDocument'
    ]
    
    # Approche différente: chercher tous les patterns {-w:p et les simplifier
    # On sait que le format est {-w:p VAR}{VAR}{/VAR}
    
    # Reconstruire le contenu en nettoyant les patterns rawxml
    def simplify_rawxml(match):
        full_match = match.group(0)
        # Extraire le nom de variable
        var_match = re.search(r'\{-w:p\s+(\w+)', full_match)
        if var_match:
            return '{' + var_match.group(1) + '}'
        return full_match
    
    # Pattern qui capture tout le bloc rawxml même avec des tags XML au milieu
    # Moins strict pour capturer plus de cas
    pattern_block = r'\{-w:p\s+\w+\}[^{]*\{\w+\}[^{]*\{/\w+\}'
    content = re.sub(pattern_block, simplify_rawxml, content)
    
    if content != original_content:
        print("Modifications appliquées!")
        
        # Écrire le contenu modifié
        with open(doc_xml_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Recréer le fichier docx
        with zipfile.ZipFile(template_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, temp_dir)
                    zipf.write(file_path, arcname)
        
        print(f"Template corrigé: {template_path}")
    else:
        print("Aucune modification nécessaire (pattern non trouvé ou déjà corrigé)")
    
    # Nettoyer le dossier temporaire
    shutil.rmtree(temp_dir)
    
    return content != original_content


def main():
    # Chemin vers les templates
    templates_dir = Path(__file__).parent.parent / "templates" / "word"
    
    templates_to_fix = [
        "template_convocation_bureau.docx",
        "template_convocation_CA.docx"
    ]
    
    for template_name in templates_to_fix:
        template_path = templates_dir / template_name
        if template_path.exists():
            fix_template(template_path)
        else:
            print(f"Template non trouvé: {template_path}")


if __name__ == "__main__":
    main()
