# Document Scanner in Typescript

Goal is to have a library that automatically uses the webcam to scan documents using opencv. Should also be possible to manually select/finetune the selection of the document.

Using minimal vite app for developing (starting dev server and exposing minium html example)

## Installation

- `git clone`
- `pnpm install`

### Running the demo app

- `pnpm run dev` for starting the dev server
- opening http://localhost:5173/

## Notes

To be able to use macOS Continuity Camera feature in Chrome, the phone needs to be in "magic pose":

> Due to privacy concern with unintended camera selection, browser based video apps only see the phone when it is in "magic pose" of landscape, screen off, locked, motionless (not handheld), and unobstructed camera. This pose is also used to trigger Automatic Camera Selection in supporting applications such as FaceTime and Photo Booth.

## Todo

- build library
- create easy-to-use API interface
- create NPM package
- demo on vercel or netlify or github etc
