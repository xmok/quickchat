<p align="center">
    <img src="./client/public/icon.svg" width="200" height="200" />
</p>

# QuickChat

A fun little project that uses [Stream](https://getstream.io/) to present a simple quick chat application.

## Tech Stack

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)

[Stream](https://getstream.io/)

## Deployment

The entire app is dockerized. But for more control, both are deployed separately:

- client: Deployed on Netlify

[![Netlify Status](https://api.netlify.com/api/v1/badges/fb2a0376-242e-4bab-a025-4424ee37d186/deploy-status)](https://app.netlify.com/sites/quickchat-xmok/deploys)

- server: Deployed using Coolify on a VPS I use for misc. projects

## 🍯 Features

- Only a username is required to chat
    - **DRAWBACK**: anyone with the username can access the information but sufficient for an exercise
- Chat w/ emojis, media
- Chat with Anthropic AI Agent in lieu of characters (Due to limitation in the Python SDK [documented in Stream Docs], AI chat will only work in the "AI Channel" which one must manually search and join OR log in using test username `xmok`)
- Characters are a WIP and will be implemented eventually

## ⚒️ Process

Since this is an exercise I purposefully tried to develop using minimum dependencies and services. However, if I were to do this as a project, I would do the following:

1. Implement proper Auth using a 3rd party service (rolling own Auth w/ Python is an option but it's better to leave Auth to the experts)
2. Have proper profiles and preferences (this can be accomplished using any DB)
3. `react-router` or `tanstack` for routing - both of these reduce complexity

For quick TTM, Supabase is a great option but given the "NoSQL"-ish architecture of Stream, I would opt for Firebase or Appwrite for both Auth and DB. Firebase Auth + Firebase Realtime DB would be enough to track channels, users, and related data.

## ⊖ Biggest Blockers:

1. Couldn't figure out why the client kept on disconnecting after logging in. This caused the largest bottleneck throughout the exercise. The cause was `<ChatView.Channels>` not rendering properly which resulted in the client auto disconnecting. This was not evident as no errors were thrown. Troubleshooting had to be old-school. I traced the component lifecycles until I finally pinpointed when the disconnect fired.

2. Python interpreter suddenly stopped being picked up by VSCode. This resulted in installed modules not being identified. Manually changing the interpreter in VSCode did not work either for reasons unbeknownst to me. Eventually, had to hardcode a virtual environment so the interpreter would be picked up.

3. I was able to add AI characters w/ personalities but streaming them from Python to the SDK ended up taking much longer. That was the 3rd and final blocker. The work is enclosed in `add-ai-stream-curse` (Add AI getStream) branch. Unfortunately, could not fully complete the bonus task. The personalities _do_ talk to each other but text becomes empty in between. Most likely there is some error on the Python end which I can not immediately pin point due to being a bit rusty.

## Final Notes:

UI and Design could have been improved by copying over code snippets from demos available on the site but I did not opt for that in order to keep code as unique as possible.

## ✨ AI

AI was used in the following places:

1. To generate personalities for AI characters themselves
2. To re-check my Docker Compose files once I was done with them

---

© Written by [xmok](https://xmok.me)

UNLICENSED