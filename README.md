# EnglishAI

EnglishAI est une application web pour apprendre l’anglais en pratiquant, plutôt qu’en suivant des leçons de grammaire. Une intelligence artificielle propose des conversations, des textes, des écoutes et des exercices oraux adaptés au niveau de la personne. L’interface est en anglais. Les traductions et une partie des explications de prononciation sont en français.

Le public visé est une personne qui apprend l’anglais et qui peut lire le français. Aucun tarif ni aucun abonnement n’est codé.

## Fonctionnalités

### Opérationnelles

Ces parcours existent dans l’application et s’appuient sur des services réels (compte, base de données, modèles d’IA, voix) dès que les variables d’environnement sont renseignées.

- **Compte.** Inscription et connexion par e-mail et mot de passe. La confirmation d’e-mail dépend des réglages du projet Supabase.
- **Premier questionnaire.** Niveau CECR déclaré, objectif, accent préféré, voix, centres d’intérêt, durée quotidienne et aisance à l’oral. Ces réponses servent de point de départ.
- **Tableau de bord.** Objectif du jour en minutes d’anglais, série de jours, indice d’acquisition, niveau estimé, points d’expérience, accès aux activités et dernier badge.
- **Conversation.** Douze situations (histoire, café, aéroport, hôtel, motos, restaurant, courses, travail, discussion libre, médecin, voyage). On écrit ou on parle au micro. L’IA répond à un niveau proche de celui de la personne, sans dire « wrong ». On peut écouter la réponse, la réécouter plus lentement, et demander une traduction en français. Les mots nouveaux sont enregistrés.
- **Écoute.** Dialogue généré de 30 secondes, 1 minute ou 2 minutes, lu par deux voix, puis questions, résumé et mots-clés.
- **Lecture.** Texte court, moyen ou long, au niveau de la personne. On peut écouter un passage, toucher un mot pour voir sa traduction française, l’enregistrer, puis répondre à un petit quiz.
- **Expression orale.** Une question adaptée au niveau. On répond au micro ou au clavier. Le retour porte sur le sens et la formulation, pas sur une note de grammaire sèche. Le niveau estimé peut bouger.
- **Prononciation.** Le micro reste ouvert. On répète une phrase anglaise, avec sa traduction française en dessous. Le coach commente les sons, puis redit le modèle en anglais. Une nouvelle phrase n’arrive que lorsque les mots sont jugés clairs (score d’au moins 80 et aucun mot à retravailler). Sous B2, les explications sont en français. À partir de B2, elles restent en anglais. Les sons travaillés : TH, H, R, voyelles courtes et longues, consonnes finales, terminaison -ed, accent de mot, W.
- **Révision.** Les mots enregistrés reviennent selon un calendrier : 10 minutes, puis 1, 3, 7, 14 et 30 jours. L’exercice est un choix multiple ou une saisie du mot anglais. Une bonne réponse rapporte des points et espace la prochaine révision. Après plusieurs réussites, le mot est marqué comme maîtrisé.
- **Progression.** Points d’expérience, série quotidienne, temps d’anglais cumulé, badges, et une page de progrès sur 14 jours (minutes, sources de points, vocabulaire).
- **Rappel du jour.** Si la personne l’active, le navigateur peut afficher une notification locale après 19 h, une fois par jour, tant que l’objectif n’est pas atteint et que l’application est ouverte.
- **Application installable.** Un manifeste et un service worker permettent de l’installer comme une application. Le service worker n’est pas actif pendant le développement local.
- **Mise à jour.** Après un déploiement, une fenêtre propose de recharger la page si une version plus récente est en ligne. En développement local, cette fenêtre ne s’affiche pas.

### Partielles

- **Accent américain ou britannique.** Le choix est enregistré au questionnaire, mais il ne change ni la voix ni les textes générés. La voix dépend seulement du choix homme ou femme.
- **Indice d’acquisition.** Affiché sur 100. Il combine surtout le niveau estimé et la série de jours. Il ne calcule pas séparément la compréhension, la fluidité, la mémoire et le vocabulaire, contrairement à l’intention décrite dans la spécification du dépôt.
- **Révision.** Deux formes d’exercice seulement (choisir ou retaper le mot). Les formes « dire à voix haute » et « reformuler » prévues dans la spécification ne sont pas là.
- **Points « mémoire ».** Une récompense de 10 points existe dans les constantes, mais aucune activité ne l’attribue.
- **Niveau et prononciation.** La conversation et l’expression orale font évoluer le niveau estimé. La prononciation, l’écoute, la lecture et la révision ne le font pas. Elles comptent pour les points, le temps d’anglais, la série et les badges.
- **Rappel.** Pas de notification poussée quand l’application est fermée. Le rappel ne part que si la page est ouverte.
- **Voix de prononciation.** L’écoute fine des sons essaie d’abord un modèle audio OpenAI. S’il n’est pas disponible, l’application se rabat sur une transcription puis une analyse du texte.

### Simulées

Aucune activité d’apprentissage n’est simulée par de fausses données. Sans clé d’API, la fonction concernée renvoie une erreur au lieu d’un résultat inventé.

### Prévues, absentes du code

La spécification `EnglishAI_Specification_Krashen.md` décrit une évolution plus large. Ne sont pas implémentés aujourd’hui : un module mémoire distinct, un paiement ou un abonnement, et le stockage de fichiers utilisateur. Les routes citées dans cette spécification, `/api/ai/analyze` et `/api/progress/update`, n’existent pas. L’analyse de la conversation est faite à l’intérieur de `/api/ai/chat`.

Le composant d’écran « bientôt disponible » n’est branché sur aucune page.

## Stack

- Next.js 16 (App Router) et React 19
- TypeScript
- Tailwind CSS 4 et composants d’interface (shadcn / Base UI)
- Supabase : authentification et base Postgres
- OpenAI : textes, traduction, transcription, et éventuellement un modèle audio pour la prononciation
- ElevenLabs : lecture à voix haute (une voix d’homme, une voix de femme)
- Serwist : application web installable, active au build de production
- Zustand est installé ; l’état des écrans est surtout géré par React

## Installation

Prérequis : Node.js 20 ou plus récent, npm, un projet Supabase et des clés OpenAI et ElevenLabs.

```bash
npm install
```

Copier `.env.example` vers `.env.local`, puis renseigner les variables. Appliquer, dans l’ordre, les fichiers SQL de `supabase/migrations` sur la base du projet Supabase. Ils créent les profils, les conversations, le vocabulaire, les révisions, les badges, les points et le temps d’anglais, avec les règles d’accès par utilisateur.

## Configuration

Aucune valeur secrète ne figure ici. Seuls les noms sont listés.

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Adresse du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase, utilisée par le navigateur |
| `SUPABASE_SERVICE_ROLE_KEY` | Présente dans `.env.example`. Le code actuel de l’application ne la lit pas |
| `OPENAI_API_KEY` | Accès OpenAI |
| `OPENAI_MODEL` | Modèle de texte. Sans valeur, `gpt-4o-mini` |
| `OPENAI_AUDIO_MODEL` | Modèle audio optionnel pour juger la prononciation |
| `ELEVENLABS_API_KEY` | Accès ElevenLabs |
| `ELEVENLABS_VOICE_ID_MALE` | Identifiant de la voix d’homme |
| `ELEVENLABS_VOICE_ID_FEMALE` | Identifiant de la voix de femme |
| `ELEVENLABS_MODEL` | Modèle de voix. Sans valeur, `eleven_turbo_v2_5` |
| `NEXT_PUBLIC_SITE_URL` | Adresse du site. L’exemple du dépôt indique seulement l’adresse locale |
| `VERCEL_GIT_COMMIT_SHA` | Fournie par l’hébergeur. Sert à détecter une nouvelle version. Absente en local |

## Commandes

```bash
npm run dev    # site local, en général http://localhost:3000
npm run lint   # vérification du code
npm run build  # version de production, service worker inclus
npm start      # sert le résultat du build
```

Il n’y a pas de commande de tests automatisés dans `package.json`.

## Données principales

Tout est rattaché au compte de la personne :

- profil (série, points, indice, temps d’anglais, questionnaire terminé ou non)
- profil de langue (niveau de départ, niveau estimé continu de 0 à 100, objectif, voix, intérêts, minutes par jour)
- conversations et messages
- vocabulaire et calendrier de révision
- badges, événements de points, événements de temps d’écoute ou de pratique

Le niveau affiché (A1 à C2) est une lecture de ce curseur continu. Il n’est pas une certification.

## Limites utiles

- L’adresse publique du site n’est pas fixée dans le dépôt.
- La page d’accueil dit « Start learning free ». Cela décrit l’absence de paiement dans l’interface, pas une offre commerciale documentée.
- Le micro de prononciation demande l’autorisation du navigateur. Chrome ou Safari sont indiqués si le micro n’est pas disponible.
- Les textes générés dépendent des modèles. Une phrase de secours existe pour la prononciation si la génération échoue.
