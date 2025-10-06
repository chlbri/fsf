# Configuration Commit Message Editor

Ce document décrit la configuration de l'extension VS Code **Commit Message
Editor** (`adam-bender.commit-message-editor`) pour standardiser les
messages de commit dans ce projet.

## À propos de l'extension

**Commit Message Editor** permet d'éditer les messages de commit dans un
formulaire personnalisable, facilitant l'utilisation d'un format
standardisé. L'extension offre :

- Un formulaire personnalisable pour les messages de commit
- Configuration portable partageable avec l'équipe
- Interface utilisateur propre avec webview dédiée
- Support des spécifications
  [Conventional Commits](https://www.conventionalcommits.org/)

## Installation

Pour installer l'extension, utilisez l'une des méthodes suivantes :

### Via la palette de commandes

1. Ouvrez la palette de commandes (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Tapez `Extensions: Install Extensions`
3. Recherchez `adam-bender.commit-message-editor`
4. Cliquez sur `Install`

### Via la ligne de commande

```bash
code --install-extension adam-bender.commit-message-editor
```

## Utilisation

### Commandes disponibles

- `Commit Message Editor: Open Editor` - Ouvre l'éditeur de message de
  commit
- `Commit Message Editor: Open Settings Page` - Ouvre la page de
  configuration
- `Commit Message Editor: Copy from SCM Input Box` - Copie depuis la boîte
  d'entrée SCM

### Ouverture de l'éditeur

1. Via la palette de commandes : `Commit Message Editor: Open Editor`
2. Via l'icône dans la barre d'outils SCM
3. Via le raccourci clavier (si configuré)

## Configuration

### Éditeur de configuration

Le moyen le plus simple de personnaliser le formulaire est d'utiliser
l'éditeur de configuration intégré :

1. Ouvrez la palette de commandes
2. Exécutez `Commit Message Editor: Open Settings Page`
3. Ou cliquez sur l'icône d'engrenage dans l'onglet Commit Message Editor

### Configuration manuelle

Vous pouvez créer un fichier de configuration JSON avec le schéma suivant :

```json
{
  "$schema": "https://bendera.github.io/vscode-commit-message-editor/schemas/config-v1.schema.json",
  "configVersion": "1",
  "staticTemplate": [
    "feat: Description courte",
    "",
    "Corps du message",
    "",
    "Pied de page"
  ],
  "dynamicTemplate": [
    "{type}({scope}): {description}",
    "",
    "{body}",
    "",
    "{breaking_change}{footer}"
  ],
  "tokens": [
    {
      "label": "Type",
      "name": "type",
      "type": "enum",
      "options": [
        {
          "label": "feat",
          "description": "Nouvelle fonctionnalité"
        },
        {
          "label": "fix",
          "description": "Correction de bug"
        },
        {
          "label": "docs",
          "description": "Modification de documentation"
        }
      ],
      "description": "Type de changement"
    }
  ]
}
```

## Structure de la configuration

### configVersion

Version du format de configuration (actuellement `"1"`)

### staticTemplate

Template pour la vue texte, tableau de chaînes (une ligne par élément)

### dynamicTemplate

Template pour la vue formulaire, tableau de chaînes. Les champs du
formulaire peuvent être référencés avec le format `{nom_token}`

### tokens

Tableau d'objets token définissant les champs du formulaire.

#### Propriétés des tokens

| Nom             | Type    | Description                                        | Valide pour |
| --------------- | ------- | -------------------------------------------------- | ----------- |
| `label`         | string  | Libellé du champ dans le formulaire                | tous        |
| `name`          | string  | Nom du token dans le template                      | tous        |
| `type`          | enum    | Type du token : `text`, `boolean`, `enum`          | tous        |
| `description`   | string  | Description plus longue sous le champ              | tous        |
| `prefix`        | string  | Texte avant la valeur (si non vide)                | tous        |
| `suffix`        | string  | Texte après la valeur (si non vide)                | tous        |
| `value`         | string  | Valeur du token boolean quand true                 | boolean     |
| `multiline`     | boolean | Entrée de texte multiligne                         | text        |
| `monospace`     | boolean | Utiliser l'éditeur monospace en mode multiligne    | text        |
| `lines`         | number  | Hauteur initiale en lignes                         | text        |
| `maxLines`      | number  | Hauteur maximale en lignes                         | text        |
| `maxLength`     | number  | Longueur maximale de la valeur                     | text        |
| `maxLineLength` | number  | Position de la règle verticale (éditeur monospace) | text        |
| `options`       | array   | Options disponibles                                | enum        |
| `multiple`      | boolean | Options multiples                                  | enum        |
| `separator`     | string  | Caractère de séparation pour options multiples     | enum        |
| `combobox`      | boolean | Sélecteur filtrable                                | enum        |

#### Structure des options (type enum)

```json
{
  "label": "Libellé affiché",
  "value": "valeur_utilisée",
  "description": "Description optionnelle"
}
```

## Configuration recommandée pour ce projet

Basée sur les instructions de commit du projet (voir
`.github/copilot-instructions.md`), voici une configuration recommandée :

```json
{
  "$schema": "https://bendera.github.io/vscode-commit-message-editor/schemas/config-v1.schema.json",
  "configVersion": "1",
  "staticTemplate": [
    "feat: Description courte",
    "",
    "Corps du message en français (max 200 mots)",
    "",
    "chlbri: bri_lvi@icloud.com"
  ],
  "dynamicTemplate": [
    "{type}({scope}): {description}",
    "",
    "{body}",
    "",
    "{breaking_change}",
    "chlbri: bri_lvi@icloud.com"
  ],
  "tokens": [
    {
      "label": "Type",
      "name": "type",
      "type": "enum",
      "options": [
        {
          "label": "feat",
          "description": "Nouvelle fonctionnalité (version mineure)"
        },
        {
          "label": "fix",
          "description": "Correction de bug (version patch)"
        },
        {
          "label": "hot-fix",
          "description": "Correction de bug critique (version patch)"
        },
        {
          "label": "docs",
          "description": "Modification/ajout documentation (version patch)"
        },
        {
          "label": "build",
          "description": "Modification des fichiers de build (pas de versionnement)"
        },
        {
          "label": "style",
          "description": "Modification du style du code (pas de versionnement)"
        },
        {
          "label": "test",
          "description": "Ajout/suppression de tests (version patch)"
        },
        {
          "label": "revert",
          "description": "Retour à un commit précédent (version patch)"
        },
        {
          "label": "chore",
          "description": "Tâches de maintenance"
        }
      ],
      "description": "Type de changement"
    },
    {
      "label": "Scope",
      "name": "scope",
      "type": "text",
      "description": "Portée du changement (optionnel)"
    },
    {
      "label": "Description",
      "name": "description",
      "type": "text",
      "maxLength": 50,
      "description": "Description courte en anglais (max 50 caractères)"
    },
    {
      "label": "Corps",
      "name": "body",
      "type": "text",
      "multiline": true,
      "lines": 3,
      "maxLines": 10,
      "description": "Description détaillée en français (max 200 mots)"
    },
    {
      "label": "Breaking Change",
      "name": "breaking_change",
      "type": "text",
      "multiline": true,
      "prefix": "BREAKING CHANGE: ",
      "description": "Description des changements cassants (optionnel)"
    }
  ],
  "view": {
    "defaultView": "form",
    "visibleViews": "both",
    "saveAndClose": true,
    "showRecentCommits": true
  }
}
```

## Import/Export de configuration

### Exporter la configuration

1. Ouvrez l'éditeur de configuration
2. Cliquez sur le bouton "Export"
3. Sauvegardez le fichier JSON

### Importer une configuration

1. Ouvrez l'éditeur de configuration
2. Cliquez sur le bouton "Import"
3. Sélectionnez votre fichier de configuration JSON
4. Choisissez si vous voulez sauvegarder dans les paramètres utilisateur ou
   workspace

## Exemples de configurations

### Configuration simple

```json
{
  "$schema": "https://bendera.github.io/vscode-commit-message-editor/schemas/config-v1.schema.json",
  "configVersion": "1",
  "dynamicTemplate": ["{type}: {description}", "", "{body}"],
  "tokens": [
    {
      "label": "Type",
      "name": "type",
      "type": "enum",
      "options": [
        { "label": "feat", "description": "Nouvelle fonctionnalité" },
        { "label": "fix", "description": "Correction" }
      ]
    },
    {
      "label": "Description",
      "name": "description",
      "type": "text"
    },
    {
      "label": "Corps",
      "name": "body",
      "type": "text",
      "multiline": true
    }
  ]
}
```

### Configuration avec Gitmoji

L'extension fournit également des configurations pré-construites incluant
le support des Gitmoji. Vous pouvez les trouver dans les
[exemples de configuration](https://github.com/bendera/vscode-commit-message-editor/tree/main/example-configs).

## Paramètres VS Code

L'extension ajoute les paramètres suivants dans VS Code :

- `commit-message-editor.confirmAmend` : Confirmer avant de modifier un
  commit
- `commit-message-editor.defaultView` : Vue par défaut (`text` ou `form`)
- `commit-message-editor.tokens` : Configuration des tokens
- `commit-message-editor.staticTemplate` : Template statique
- `commit-message-editor.dynamicTemplate` : Template dynamique

## Dépannage

### L'extension ne s'ouvre pas

- Vérifiez que Git est installé et configuré
- Assurez-vous d'être dans un dépôt Git
- Redémarrez VS Code

### Configuration non appliquée

- Vérifiez la syntaxe JSON de votre configuration
- Utilisez le schéma JSON pour la validation
- Rechargez la fenêtre VS Code

### Problèmes de performance

- Réduisez le nombre de commits récents affichés
- Désactivez l'affichage des commits récents dans les paramètres

## Liens utiles

- [Extension sur VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=adam-bender.commit-message-editor)
- [Dépôt GitHub](https://github.com/bendera/vscode-commit-message-editor)
- [Schéma de configuration](https://bendera.github.io/vscode-commit-message-editor/schemas/config-v1.schema.json)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Documentation VS Code pour JSON](https://code.visualstudio.com/docs/languages/json)

## Support

Pour les problèmes et questions :

- [Issues GitHub](https://github.com/bendera/vscode-commit-message-editor/issues)
- [Discussions GitHub](https://github.com/bendera/vscode-commit-message-editor/discussions)
