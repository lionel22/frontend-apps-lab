# Feature Specification: Music Library Control Center Frontend

**Feature Branch**: `[002-music-library-control-center]`
**Created**: 2026-05-20
**Status**: Ready for Implementation
**Input**: Concevoir une UI basique et futuriste pour piloter les workflows d'ingestion, d'organisation et de recherche musicale afin d'alimenter un dossier local exploité par Navidrome.

## Problem / Goal

Le backend de gestion musique expose des capacités clés, mais il manque une interface unique et claire pour piloter ces workflows de bout en bout.

Objectif MVP : livrer un cockpit frontend simple, moderne et lisible qui permet de :

1. soumettre des sources musicales par URL ou upload,
2. suivre précisément les statuts d'ingestion et les erreurs,
3. organiser la bibliothèque avec prévisualisation dry-run,
4. rechercher rapidement un titre par auto-completion,
5. lancer une recherche de morceaux similaires en mode LLM ou non-LLM,
6. sélectionner plusieurs résultats puis les envoyer en ingestion batch,
7. garder une vision synthétique de l'activité opérateur.

Succès attendu : réduire les manipulations manuelles, limiter les erreurs d'organisation et accélérer la constitution d'une librairie cohérente pour Navidrome.

## UX Direction

La direction visuelle MVP est `basic futuriste` :

1. hiérarchie nette et surfaces sobres,
2. contraste élevé et lisibilité immédiate,
3. feedback d'état visible sur chaque action importante,
4. responsive desktop et mobile,
5. parcours clavier complet pour les actions critiques,
6. pas d'effets visuels inutiles ni de complexité décorative.

## In Scope (MVP)

1. Écran d'ingestion par URL.
2. Écran d'upload de fichier.
3. Historique récent des jobs d'ingestion.
4. Liste des statuts avec filtres simples et rafraîchissement.
5. Écran d'organisation avec configuration simple des règles.
6. Dry-run obligatoire avant application réelle.
7. Affichage du diff ou plan d'organisation.
8. Champ de recherche de titres avec auto-completion et suggestions réutilisables.
9. Écran de recherche `similar` avec mode LLM et mode `catalog`, Last.fm étant le provider non-LLM par défaut au MVP.
10. Affichage d'une shortlist avec multi-sélection.
11. Déclenchement d'une ingestion batch depuis cette shortlist.
12. Vue centre de contrôle avec KPI simples et activité récente.
13. Gestion uniforme des états loading, error, empty et success.

## Out of Scope (MVP)

1. Lecteur audio avancé ou preview waveform.
2. Édition fine des tags audio dans l'UI.
3. Playlists collaboratives ou fonctionnalités sociales.
4. Mode offline-first.
5. Authentification multi-rôles avancée.
6. Monitoring temps réel complexe avec dashboards techniques riches.
7. Automatisations planifiées avancées.

## User Scenarios and Testing

### User Story 1 - Soumettre et suivre l'ingestion (Priority: P1)

En tant qu'opérateur, je veux soumettre des morceaux par URL ou upload et suivre leur statut afin de savoir rapidement si la bibliothèque s'alimente correctement.

**Why this priority**: sans ce flux, le frontend ne couvre pas la capacité la plus importante du produit.

**Independent Test**: soumettre une URL valide et un upload valide, puis vérifier l'apparition des jobs, l'évolution des statuts et l'affichage d'une erreur contrôlée sur un cas invalide.

**Acceptance Scenarios**:

1. **Given** une URL valide, **When** je la soumets, **Then** un job apparaît dans la liste des ingestions.
2. **Given** un fichier valide, **When** je l'upload, **Then** le frontend affiche un état de soumission puis un statut traçable.
3. **Given** une entrée invalide, **When** je tente la soumission, **Then** l'interface affiche une erreur claire avant ou après l'appel API selon le cas.

### User Story 2 - Rechercher un titre par auto-completion (Priority: P1)

En tant qu'opérateur, je veux saisir une partie d'un titre et obtenir des suggestions immédiatement réutilisables afin de retrouver rapidement un morceau connu.

**Why this priority**: sans cette aide, le flux impose encore une recherche manuelle externe ou la connaissance de l'URL exacte.

**Independent Test**: saisir un fragment de titre connu, observer les suggestions, sélectionner un résultat puis l'utiliser pour préremplir un flux d'ingestion ou une recherche same-style.

**Acceptance Scenarios**:

1. **Given** une requête partielle valide, **When** je saisis un titre, **Then** l'UI affiche une liste bornée de suggestions.
2. **Given** une requête trop courte ou sans résultat, **When** je saisis du texte, **Then** l'interface affiche un état neutre ou vide sans erreur trompeuse.
3. **Given** une suggestion sélectionnée, **When** je poursuis le workflow, **Then** elle peut être utilisée pour l'ingestion ou comme référence same-style.

### User Story 3 - Organiser avec sécurité dry-run (Priority: P1)

En tant qu'opérateur, je veux prévisualiser une règle d'organisation avant application réelle pour éviter des mouvements de fichiers non souhaités.

**Why this priority**: le dry-run protège directement l'intégrité de la bibliothèque.

**Independent Test**: configurer une règle, lancer le dry-run, vérifier le diff affiché, puis confirmer l'application réelle et consulter le résumé final.

**Acceptance Scenarios**:

1. **Given** une règle d'organisation configurée, **When** je lance un dry-run, **Then** le plan d'actions apparaît sans exécution réelle.
2. **Given** un dry-run terminé, **When** je confirme l'exécution, **Then** l'UI lance l'organisation réelle et affiche son résultat.
3. **Given** des conflits ou éléments ignorés, **When** le résultat est rendu, **Then** ils sont explicitement listés.

### User Story 4 - Trouver des morceaux similaires et les ingérer en lot (Priority: P2)

En tant qu'opérateur, je veux lancer une recherche de similarité, éventuellement à partir d'un titre choisi par auto-completion, en mode LLM ou en mode `catalog` basé sur Last.fm au MVP, sélectionner plusieurs candidats et déclencher leur ingestion batch afin d'enrichir rapidement ma bibliothèque.

**Why this priority**: cette capacité accélère la découverte et la curation sans workflow externe.

**Independent Test**: lancer une requête de similarité, sélectionner au moins trois résultats, déclencher le batch, puis suivre les jobs créés.

**Acceptance Scenarios**:

1. **Given** une référence musicale valide, **When** je lance une recherche en mode LLM ou non-LLM, **Then** une shortlist consultable est affichée avec l'indication du provider utilisé.
2. **Given** plusieurs candidats affichés, **When** je les sélectionne, **Then** l'UI maintient une sélection multiple stable et explicite.
3. **Given** une sélection prête, **When** je la soumets, **Then** un lot d'ingestion est créé et visible dans le suivi.

### User Story 5 - Piloter via un cockpit lisible sur desktop et mobile (Priority: P2)

En tant qu'opérateur, je veux une interface claire, responsive et accessible afin d'exécuter les workflows principaux sans friction sur desktop comme sur mobile.

**Why this priority**: la qualité opérateur dépend autant de la lisibilité que des fonctionnalités.

**Independent Test**: exécuter les trois workflows MVP sur desktop et mobile, au clavier et au tactile, sans blocage fonctionnel.

**Acceptance Scenarios**:

1. **Given** un viewport desktop, **When** je navigue entre les écrans, **Then** les informations restent hiérarchisées et lisibles.
2. **Given** un viewport mobile, **When** je lance une action critique, **Then** l'interaction reste exploitable sans contenu coupé.
3. **Given** un usage clavier, **When** je parcours les actions essentielles, **Then** le focus et les labels restent clairs.

## Edge Cases

1. Backend indisponible ou réponse lente.
2. Job sans progression détaillée, seulement avec statuts discrets.
3. Auto-completion sans résultat, trop de résultats ambigus ou saisie trop courte.
4. Provider LLM ou non-LLM indisponible ou dégradé.
5. Batch partiellement réussi avec échecs unitaires.
6. Diff dry-run très volumineux.
7. Métadonnées candidates incomplètes dans la shortlist.
8. Upload interrompu ou rejeté côté backend.
9. Conflits d'organisation nécessitant une confirmation explicite.

## Functional Requirements

- **FR-001**: Le frontend MUST permettre la soumission d'une source musique via URL.
- **FR-002**: Le frontend MUST permettre l'upload d'un ou plusieurs fichiers selon les limites exposées par le backend.
- **FR-003**: Le frontend MUST valider les entrées minimales comme URL, extension et taille si ces contraintes sont connues.
- **FR-004**: Chaque soumission MUST créer une entrée visible dans la liste des ingestions.
- **FR-005**: La liste des ingestions MUST afficher au minimum statut, date, source, identifiant du job et dernière mise à jour.
- **FR-006**: Les statuts MUST couvrir au minimum `queued`, `processing`, `success` et `failed`.
- **FR-007**: En cas d'échec, l'UI MUST afficher un message d'erreur compréhensible et actionnable.
- **FR-008**: L'opérateur MUST pouvoir filtrer les jobs par statut.
- **FR-009**: L'opérateur MUST pouvoir déclencher un rafraîchissement manuel.
- **FR-010**: L'UI MUST supporter un auto-refresh léger et simple à comprendre.
- **FR-011**: L'opérateur MUST pouvoir définir une règle d'organisation depuis l'interface.
- **FR-012**: Toute exécution d'organisation MUST proposer un dry-run avant application réelle.
- **FR-013**: Le dry-run MUST afficher les impacts prévus comme déplacements, conflits et fichiers ignorés.
- **FR-014**: L'exécution réelle MUST exiger une confirmation explicite après consultation du dry-run.
- **FR-015**: Le résultat final d'organisation MUST afficher un récapitulatif des succès, ignorés et erreurs.
- **FR-016**: L'opérateur MUST pouvoir lancer une recherche `same style` via l'API backend.
- **FR-017**: La shortlist MUST afficher les métadonnées minimales utiles à la décision.
- **FR-018**: L'opérateur MUST pouvoir sélectionner plusieurs éléments dans la shortlist.
- **FR-019**: L'opérateur MUST pouvoir soumettre cette sélection en ingestion batch.
- **FR-020**: La création du batch MUST renvoyer un état initial et des identifiants de suivi exploitables dans l'UI.
- **FR-021**: Le centre de contrôle MUST afficher des KPI simples comme jobs actifs, échecs récents et dernières opérations.
- **FR-022**: Tous les écrans MVP MUST implémenter les états `loading`, `error`, `empty` et `success`.
- **FR-023**: Le frontend MUST rester un client API sans logique métier lourde propre au domaine musical.
- **FR-024**: Le workflow global MUST expliciter sa finalité d'alimentation du dossier local pour Navidrome.
- **FR-025**: Le frontend MUST fournir un champ de recherche de titres avec auto-completion et debounce raisonnable.
- **FR-026**: Les suggestions MUST afficher suffisamment de métadonnées pour désambiguïser au minimum le titre, l'artiste et la source quand disponibles.
- **FR-027**: Une suggestion sélectionnée MUST pouvoir être réutilisée pour préremplir une ingestion ou servir de référence à une recherche `same style`.
- **FR-028**: L'UI MUST gérer explicitement les cas de requête trop courte et d'absence de résultat sans présenter cela comme une erreur système.
- **FR-029**: L'écran de recherche similaire MUST permettre de choisir un mode `LLM` ou `catalog`, le provider concret du mode `catalog` restant backend-driven avec Last.fm par défaut au MVP.
- **FR-030**: La shortlist MUST indiquer le provider utilisé pour expliquer l'origine de la recommandation.
- **FR-031**: En cas d'indisponibilité d'un provider, l'UI MUST présenter un message d'échec contrôlé, conserver la saisie et permettre une relance explicite ou un changement manuel de mode, sans fallback automatique frontend.
- **FR-032**: Le monitoring des jobs et les KPI du cockpit MUST consommer une lecture canonique `GET /api/v1/music/ingestions` renvoyant une liste filtrable de jobs et des compteurs agrégés suffisants pour le MVP.
- **FR-033**: Le transport temps réel MVP MUST rester en polling uniquement ; aucun comportement SSE n'est requis pour livrer les workflows MVP.
- **FR-034**: La référence réutilisable issue de l'auto-completion MUST avoir une forme stable contenant au minimum `provider`, un identifiant externe ou un seed `title/artist`, et un libellé réutilisable par l'UI.
- **FR-035**: Le dry-run d'organisation MUST être normalisé autour d'un payload stable contenant `summary`, `plannedMoves`, `skippedConflicts` et `ignoredItems`.
- **FR-036**: Quand `NUXT_PUBLIC_MUSIC_REQUIRE_AUTH` est actif, le frontend MUST capturer un bearer token opérateur partagé, le persister dans une session frontend légère, et l'attacher à tous les appels API music.
- **FR-037**: Le même endpoint `POST /api/v1/music/organize` MUST distinguer dry-run et apply via `dryRun`, et la réponse d'apply MUST retourner au minimum `organizationRunId`, `summary`, `appliedMoves`, `skippedConflicts`, `ignoredItems` et les erreurs unitaires quand présentes.

## MVP Contract Decisions

1. La page jobs et le dashboard dérivent leurs KPI simples du même endpoint `GET /api/v1/music/ingestions`; aucun endpoint KPI dédié n'est requis au MVP.
2. Le rafraîchissement asynchrone reste en polling uniquement au MVP, avec intervalles configurables côté frontend.
3. Une suggestion d'auto-completion expose une `reference` stable comprenant `provider`, `externalId` ou `title/artist`, `label`, et éventuellement une URL déjà résolue si le backend en fournit une.
4. Le dry-run d'organisation retourne toujours `summary`, `plannedMoves`, `skippedConflicts` et `ignoredItems`, ce qui fige le contrat de normalisation frontend.
5. En cas d'échec provider, l'UI garde les entrées opérateur, affiche un état contrôlé, et ne fait aucun fallback automatique entre `LLM` et `catalog`.
6. Les limites d'upload affichées par défaut au MVP sont alignées sur le backend music et initialisées à 100 MB tant qu'aucun contrat de capability distinct n'existe.
7. Si l'auth est requise, le token opérateur partagé est capturé une fois via une session frontend simple et injecté dans `useMusicApi` pour tous les appels music.
8. `POST /api/v1/music/organize` utilise `dryRun=true` pour la prévisualisation et `dryRun=false` pour l'exécution, avec une réponse d'apply stable orientée résumé plus détails.

## Non-Functional Requirements

- **NFR-001**: L'interface MUST être exploitable sur desktop et mobile pour toutes les actions MVP.
- **NFR-002**: Le feedback visuel d'une action utilisateur SHOULD apparaître en moins de 200 ms.
- **NFR-003**: Les parcours critiques SHOULD rester compréhensibles même si le backend répond lentement.
- **NFR-004**: Le parcours clavier MUST couvrir ingestion, organisation et batch ingestion.
- **NFR-005**: Le contraste et la lisibilité MUST être suffisants sur les éléments critiques.
- **NFR-006**: L'architecture frontend SHOULD rester simple, modulaire et extensible sans refonte majeure.
- **NFR-007**: Les erreurs API SHOULD être exploitables pour le debug opérateur sans exposer d'information sensible.
- **NFR-008**: Les libellés et feedbacks SHOULD rester clairs, cohérents et non ambigus.
- **NFR-009**: Le MVP SHOULD être stable sur navigateurs modernes récents.
- **NFR-010**: Les dépendances retenues MUST être proportionnées au scope et éviter la sur-ingénierie.

## Acceptance Criteria

1. Une URL valide peut être soumise et apparaît dans le suivi avec un statut évolutif.
2. Un upload valide déclenche un job visible avec feedback immédiat.
3. Les erreurs d'entrée invalide sont clairement expliquées.
4. Le dry-run d'organisation affiche un aperçu exploitable avant toute action réelle.
5. L'organisation réelle ne peut pas être lancée sans confirmation explicite.
6. Une recherche de titre par auto-completion retourne des suggestions exploitables et sélectionnables.
7. Une recherche similaire retourne une shortlist exploitable à l'écran en mode LLM et en mode `catalog` basé sur Last.fm au MVP.
8. La multi-sélection et la création batch fonctionnent de bout en bout.
9. Tous les écrans MVP gèrent correctement `loading`, `error`, `empty` et `success`.
10. Les workflows MVP restent utilisables sur mobile et au clavier.
11. La liste des jobs et les KPI simples du cockpit sont alimentés par la même lecture canonique de jobs sans endpoint dashboard dédié.
12. Une indisponibilité provider produit un état contrôlé avec relance explicite ou changement manuel de mode, sans fallback automatique frontend.

## Risks / Assumptions

### Risks

1. Réponses LLM de similarité trop bruitées pour une sélection fiable.
2. Contrats API backend incomplets ou instables pendant l'implémentation.
3. Diff dry-run trop verbeux pour rester lisible.
4. Messages d'erreur backend trop techniques pour l'opérateur final.
5. Perception de lenteur sur mobile pour les uploads ou gros résultats.

### Assumptions

1. Le backend expose des endpoints stables pour ingestion, statuts, organisation, similarité et batch.
2. L'API renvoie des identifiants de jobs et des statuts cohérents.
3. Le backend gère déjà les permissions système et le stockage local.
4. Le MVP ne nécessite pas d'authentification multi-tenant complexe.
5. Le dossier cible suit des conventions de nommage gérées côté backend.
6. Le backend expose Last.fm comme provider `catalog` par défaut pour ce MVP.

## Open Questions

1. Faut-il afficher explicitement les règles de naming Navidrome dans l'interface principale ou seulement dans l'aide contextuelle ?
2. Faut-il autoriser plus tard l'édition manuelle d'une shortlist avant batch au-delà de la simple désélection MVP ?

## Requirements Quality Checklist

- [x] Le problème utilisateur est relié à une valeur métier explicite.
- [x] Le MVP reste borné et sans sur-ingénierie.
- [x] Les frontières `In Scope` et `Out of Scope` sont explicites.
- [x] Les user stories sont testables indépendamment.
- [x] Les requirements fonctionnelles sont atomiques et traçables.
- [x] Les états UI obligatoires sont couverts sur tous les flux clés.
- [x] Les contraintes responsive et accessibilité sont documentées.
- [x] Les dépendances backend et hypothèses critiques sont explicitées.
- [x] Les critères d'acceptation sont observables et mesurables.
- [x] La finalité Navidrome est couverte de bout en bout.

## Optional High-Value Features

1. Presets de règles d'organisation prêtes à l'emploi.
2. Retry ciblé des jobs en échec.
3. Sauvegarde de requêtes de similarité fréquentes.
4. Comparaison de deux shortlists avant soumission batch.
5. Export léger des opérations récentes au format CSV ou JSON.
