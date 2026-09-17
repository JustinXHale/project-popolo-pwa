# Project Pōpolo PWA

Public site and referee platform for [projectpopolo.com](https://projectpopolo.com/). Marketing pages are Markdown in this repo. Referee logs, evaluations, photo submissions, and tournament requests live in Firebase.

## Local

```bash
npm install
npm install --prefix functions
npm run dev
```

Without `.env.local`, the app runs in **demo mode**. On `/login` you can sign in as referee, coach, or admin.

Copy `.env.example` to `.env.local` when you have a Firebase project.

## Stack

Vite, React 19, TypeScript, `vite-plugin-pwa`, Firebase Auth / Firestore / Storage / Functions / Hosting.

## Edit pages

See [docs/CONTENT.md](docs/CONTENT.md).

## Firebase

Create a project (this repo expects `projectpopolo`), enable Auth (Google, Apple, email/password), Firestore, Storage, and App Check (reCAPTCHA v3). Set `MASTER_ADMIN_EMAIL` on Cloud Functions to your login email. Blaze is required for Functions; App Check itself is no-cost.

```bash
npm run deploy
```
# project-popolo-pwa
