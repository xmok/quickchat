# QuickChat

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
Stream

Issues:
Couldn't figure out why the client kept on disconnecting after logging in. This caused the largest bottleneck throughout the exercise. The cause was `<ChatView.Channels>` not rendering properly which resulted in the client auto disconnecting. This was not evident as no errors were thrown. Troubleshooting had to be old-school. I traced the component lifecycles until I finally pinpointed when the disconnect fired.