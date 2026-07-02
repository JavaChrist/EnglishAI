# EnglishAI --- Spécification complète (MVP → SaaS)

> **Objectif :** créer une application d'apprentissage de l'anglais
> basée sur la méthode de Stephen Krashen, combinée à l'IA, aux
> neurosciences et à une gamification intelligente.

## Vision

Créer une application qui ne donne pas l'impression de suivre des cours,
mais de vivre des conversations réelles avec une IA qui s'adapte en
permanence au niveau de l'utilisateur.

------------------------------------------------------------------------

# Les piliers

-   Input compréhensible (Krashen)
-   IA adaptative en temps réel
-   Répétition espacée
-   Mémoire active
-   Réactivation intelligente
-   Gamification
-   Progression invisible

------------------------------------------------------------------------

# Stack technique

-   Next.js App Router
-   TypeScript
-   TailwindCSS
-   shadcn/ui
-   Supabase (Auth, Database, Storage)
-   PWA
-   API LLM (OpenAI ou compatible)
-   ElevenLabs
    -   1 voix masculine
    -   1 voix féminine

------------------------------------------------------------------------

# UX

L'application est **100 % en anglais**.

Aucune leçon de grammaire classique.

L'utilisateur apprend par : - écoute - lecture - conversations -
immersion - réactivation du vocabulaire

------------------------------------------------------------------------

# Fonctionnalités

## Onboarding

Collecter :

-   Niveau estimé
-   Objectif
-   Accent préféré
-   Voix préférée
-   Centres d'intérêt
-   Temps quotidien
-   Confiance à l'oral

------------------------------------------------------------------------

## Dashboard

Afficher :

-   Today's Goal
-   Start Conversation
-   Listening Session
-   Reviews Due
-   Current Streak
-   Acquisition Index
-   Dernier badge

------------------------------------------------------------------------

## Conversation Lab

Scénarios :

-   Coffee Shop
-   Airport
-   Hotel
-   Motorcycles
-   Restaurant
-   Shopping
-   Business
-   Small Talk
-   Doctor
-   Travel

L'IA :

-   adapte la difficulté (i+1)
-   simplifie si besoin
-   enrichit progressivement
-   ne dit jamais "Wrong"

Feedback :

-   Good try!
-   Nice sentence!
-   Almost!
-   A native speaker would usually say...

------------------------------------------------------------------------

## Listening Room

Dialogues audio :

-   30 s
-   1 min
-   2 min

Avec :

-   compréhension
-   résumé
-   mots-clés

------------------------------------------------------------------------

## Review & Memory

Répétition espacée :

-   10 min
-   1 jour
-   3 jours
-   7 jours
-   14 jours
-   30 jours

Exercices :

-   compléter
-   retrouver
-   parler
-   choisir
-   reformuler

------------------------------------------------------------------------

## IA adaptative

Analyse :

-   compréhension
-   fluidité
-   prononciation
-   vocabulaire
-   temps de réponse
-   confiance

Le prompt système doit :

-   rester bienveillant
-   fournir du "comprehensible input"
-   rester dans la zone i+1
-   réutiliser le vocabulaire appris

------------------------------------------------------------------------

## ElevenLabs

Deux voix uniquement :

-   Male
-   Female

Fonctions :

-   Play
-   Replay slowly
-   Repeat after me

------------------------------------------------------------------------

## Progression

Créer un **Acquisition Index** basé sur :

-   compréhension
-   fluidité
-   mémoire
-   confiance
-   vocabulaire actif
-   vocabulaire passif
-   régularité

------------------------------------------------------------------------

## Gamification

XP :

-   Conversation
-   Listening
-   Speaking
-   Memory
-   Review

Badges :

-   First Conversation
-   7 Day Streak
-   100 Words Heard
-   Travel Ready
-   Native Listener
-   Motorcycle Talker
-   Business Starter

------------------------------------------------------------------------

## Base de données

Tables principales :

-   users_profile
-   language_profile
-   conversations
-   conversation_messages
-   vocabulary_items
-   reviews
-   achievements
-   xp_events

------------------------------------------------------------------------

## API

-   /api/ai/chat
-   /api/ai/analyze
-   /api/voice/generate
-   /api/review/schedule
-   /api/progress/update

------------------------------------------------------------------------

# MVP

1.  Auth
2.  Onboarding
3.  Dashboard
4.  Conversation IA
5.  ElevenLabs
6.  Progression
7.  Révision
8.  Badges
9.  PWA

------------------------------------------------------------------------

# Vision long terme

Créer un **coach linguistique IA** qui accompagne l'utilisateur
quotidiennement grâce à l'acquisition naturelle de la langue plutôt qu'à
des cours traditionnels.
