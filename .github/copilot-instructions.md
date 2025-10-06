## Charte des commits

### Règles générales

- **Langue** : Utiliser strictement l'anglais pour tous les messages de
  commit
- **Clarté** : Messages concis et descriptifs
- **Format** : Suivre la convention Conventional Commits
- **Outils** : Utiliser l'extension VS Code
  `adam-bender.commit-message-editor`

### Format des commits

#### Structure obligatoire

```
<type>(<scope>): <description>

<body>

<breaking_change>
<footer>
<NOCI>

@chlbri:bri_lvi@icloud.com
```

#### Types de commits disponibles

| Type       | Description                                | Impact version       |
| ---------- | ------------------------------------------ | -------------------- |
| `feat`     | Nouvelle fonctionnalité                    | Version mineure      |
| `fix`      | Correction de bug standard                 | Version patch        |
| `hotfix`   | Correction de bug critique                 | Version patch        |
| `docs`     | Modification/ajout documentation           | Version patch        |
| `build`    | Modification des fichiers de build         | Pas de versionnement |
| `chore`    | Tâches de maintenance                      | Pas de versionnement |
| `ci`       | Modifications CI/CD (Travis, Circle, etc.) | Pas de versionnement |
| `perf`     | Amélioration des performances              | Version patch        |
| `refactor` | Refactoring sans ajout/correction          | Pas de versionnement |
| `revert`   | Retour à un commit précédent               | Version patch        |
| `style`    | Modification du style du code              | Pas de versionnement |
| `test`     | Ajout/suppression de tests                 | Version patch        |

#### Scope (optionnel)

Portée du changement, par exemple :

- `(parser)` : Modifications du parseur
- `(cli)` : Modifications de l'interface en ligne de commande
- `(deps)` : Modifications des dépendances
- `(config)` : Modifications de configuration

#### Description

- **Longueur** : Maximum 50 caractères
- **Style** : Impératif présent ("add" pas "added")
- **Capitalisation** : Première lettre minuscule
- **Ponctuation** : Pas de point final

#### Corps (optionnel)

- **Longueur** : Maximum 200 mots
- **Langue** : Français accepté pour le corps détaillé
- **Format** : Lignes de 72 caractères maximum
- **Contenu** : Expliquer le "pourquoi" et le "comment"

#### Breaking Changes

- **Format** : `BREAKING CHANGE: <description>`
- **Obligatoire** : Pour tous les changements cassants
- **Impact** : Déclenche une version majeure

#### Footer

- **Références** : Issues, PR, etc.
- **Co-auteurs** : `Co-authored-by: name <email>`
- **Signature** : `@chlbri:bri_lvi@icloud.com` (obligatoire)

#### Flags spéciaux

- `_NO_CI` : Skip les builds CI/CD
- Utiliser avec parcimonie

### Exemples de commits

#### Nouvelle fonctionnalité

```
feat(cli): add lint script support

Ajout du support pour un troisième script obligatoire (lint)
dans la configuration CLI. Permet une validation complète
du code avec test → build → lint.

@chlbri:bri_lvi@icloud.com
```

#### Correction de bug

```
fix(orchestrator): resolve rollback failure on script timeout

Correction du mécanisme de rollback qui ne s'exécutait pas
correctement lors d'un timeout des scripts de validation.

Fixes #42

@chlbri:bri_lvi@icloud.com
```

#### Breaking change

```
feat(api): restructure dependency state interface

BREAKING CHANGE: DependencyState interface now requires
semverSign field and renames dependencyType to type.

Migration guide:
- Add semverSign: '^' | '~' | 'exact'
- Rename dependencyType → type

@chlbri:bri_lvi@icloud.com
```

#### Documentation

```
docs: update valibot integration guide

Ajout de documentation complète pour l'intégration de Valibot
avec exemples de schémas et patterns de validation.

@chlbri:bri_lvi@icloud.com
```

#### Hotfix critique

```
hotfix(security): patch dependency vulnerability

Correction urgente d'une vulnérabilité de sécurité dans
les dépendances. Application immédiate nécessaire.

CVE-2023-12345

@chlbri:bri_lvi@icloud.com
```

### Configuration VS Code

#### Installation de l'extension

```bash
code --install-extension adam-bender.commit-message-editor
```

#### Utilisation

1. Palette de commandes : `Commit Message Editor: Open Editor`
2. Icône dans la barre SCM
3. Configuration automatique via `.github/vsix.commit-message-editor.json`

#### Fichiers de configuration

- **Documentation** : `.github/commit-message-editor.md`
- **Configuration** : `.github/vsix.commit-message-editor.json`

### Validation des commits

#### Vérifications automatiques

- Format Conventional Commits
- Longueur de la description
- Présence de la signature
- Types de commits valides

#### Outils recommandés

- `commitizen` : Assistant de commit interactif
- `commitlint` : Validation automatique des messages
- `husky` : Git hooks pour validation pré-commit

### Cas particuliers

#### Merge commits

```
merge: integrate feature branch into main

Fusion de la branche feature/lint-script-support
avec résolution des conflits de merge.

@chlbri:bri_lvi@icloud.com
```

#### Revert commits

```
revert: "feat(cli): add experimental flag parsing"

This reverts commit 1234567890abcdef.
Cause: Performance regression in production.

@chlbri:bri_lvi@icloud.com
```

#### Commits de release

```
chore(release): bump version to 2.1.0

Release notes:
- New lint script support
- Enhanced rollback mechanism
- Performance improvements

@chlbri:bri_lvi@icloud.com
```

### Bonnes pratiques

1. **Atomic commits** : Un commit = un changement logique
2. **Test avant commit** : Toujours vérifier que les tests passent
3. **Rebase interactif** : Nettoyer l'historique avant push
4. **Messages descriptifs** : Expliquer le contexte et les motivations
5. **Référencer les issues** : Lier les commits aux problèmes résolus

### À éviter

❌ **Messages vagues**

```
fix: bug fix
update: changes
```

❌ **Messages trop longs**

```
feat: add a very long description that exceeds the 50 character limit and makes it hard to read
```

❌ **Mélange de langues**

```
feat: add nouvelle fonctionnalité for parsing
```

❌ **Commits trop gros**

```
feat: add 15 new features and fix 10 bugs
```

### Ressources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Extension VS Code](https://marketplace.visualstudio.com/items?itemName=adam-bender.commit-message-editor)
- [Configuration projet](vsix.commit-message-editor.json)
- [Documentation complète](commit-message-editor.md)

## Contexte : Gestion améliorée de l'état des dépendances

**Fonctionnalité actuelle** : 002-spec-validate-bullet - Gestion améliorée
de l'état des dépendances et mécanisme de rollback

**Stack technique** :

- Langage : TypeScript 5.x avec Node.js >= 22
- Framework : cmd-ts, execa, utilitaires de parsing semver
- Stockage : Gestion d'état en mémoire lors du processus d'upgrade (pas de
  stockage persistant)
- Type de projet : Bibliothèque unique - outil CLI avec architecture par
  couche de services

**Composants clés** :

- DependencyStateManager : Service central de gestion d'état
- PackageManagerAdapter : Abstraction pour npm/yarn/pnpm/bun
- ScriptConfig : Configuration typée pour l'exécution de scripts
- Mécanisme de rollback : Opérations atomiques avec restauration complète

**Modifications récentes** :

- Ajout du suivi d'état des dépendances avec préservation des opérateurs
  semver
- Implémentation d'un rollback automatique sur échec d'exécution de scripts
- Amélioration du CLI avec support configurable des scripts test/build/lint
- Ajout du pattern d'adaptateur de gestionnaire de packages pour
  compatibilité multi-PM
