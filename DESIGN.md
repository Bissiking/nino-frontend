# Nino Frontend Design

## Direction

Nino uses a signal-console interface: dark viewing-room surfaces, phosphor green primary action, amber status accents and precise media rails that make playback state visible.

## Tokens

- Background: `#07100d`
- Surface: `#111f1a`
- Ink: `#effbf3`
- Muted text: `#a2b8ad`
- Primary accent: `#6dff9b`
- Status accent: `#ffd36a`
- Radius: 6px to 8px for controls and media surfaces

## Interaction

Focus is visible with an amber outline. TV and keyboard navigation use native links/buttons. Motion is limited to signal sweeps, loading rotation and nonessential progress affordances, with reduced-motion support.

## Components

- `AppShell`: desktop sidebar and mobile bottom navigation.
- `HeroConsole`: first-viewport media signal and primary play action.
- `Rail`: horizontal content rows with empty states.
- `MediaCard`: stable poster card with progress trace.
- `StateBlock`: loading, empty and error states.

