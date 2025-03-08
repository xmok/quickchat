<p align="center">
    <img src="./client/public/icon.svg" width="200" height="200" />
</p>

# QuickChat

A fun little project that uses [Stream](https://getstream.io/) to present a simple quick chat application.

## 🍯 Features

- Only a username is required to chat
    - **DRAWBACK**: anyone with the username can access the information but sufficient for an exercise

## ⚒️ Process

Since this is an exercise I purposefully tried to develop using minimum dependencies and services. However, if I were to do this as a project, I would do the following:

1. Implement proper Auth using a 3rd party service (rolling own Auth w/ Python is an option but it's better to leave Auth to the experts)
2. Have proper profiles and preferences (this can be accomplished using any DB)
3. `react-router` or `tanstack` for routing - both of these reduce complexity

For quick TTM, Supabase is a great option but given the "NoSQL"-ish architecture of Stream, I would opt for Firebase or Appwrite for both Auth and DB. Firebase Auth + Firebase Realtime DB would be enough to track channels, users, and related data.

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
Stream

## ⊖ Biggest Blockers:

1. Couldn't figure out why the client kept on disconnecting after logging in. This caused the largest bottleneck throughout the exercise. The cause was `<ChatView.Channels>` not rendering properly which resulted in the client auto disconnecting. This was not evident as no errors were thrown. Troubleshooting had to be old-school. I traced the component lifecycles until I finally pinpointed when the disconnect fired.

2. Python interpreter suddenly stopped being picked up by VSCode. This resulted installed modules not being identified errors. Manually changing the interpreter in VSCode did not work either for reasons unbeknownst. Eventually, had to hardcode a virtual environment so it would be picked up.