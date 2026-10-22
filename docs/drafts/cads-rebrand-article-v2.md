# How AI helped us turn our rebrand into a stronger design system

*By Moshe Bari, Senior Product Designer*

When the new CodeAI brand started to land, we had a matter of weeks to roll it out across the entirety of our product. Sounds simple enough: a new logo, new type and some new colors. But it's no small task for a sprawling platform built over more than a decade, with newer surfaces mostly built on our design system, older ones that predate it, and plenty of mixed-up screens in between.

From a design standpoint, the plan (at first) was simple: swap some old color values for the new ones and move on. It only took a handful of hex code updates to see the new brand wasn't going to slot in that neatly.

[Placeholder (hero art): before/after of a product screen.]

That moment ended up shaping everything that followed. Design systems often grow one decision at a time, and sometimes in a vacuum. Moments that put everything in play at once don't come along often, and a rebrand is one of them. So instead of just repainting the product, we used the rebrand to fix what was underneath it.

We shipped it, though not everyone was sure we could in the time we had, and came out with a stronger design system than we went in with: a cleaner color system, a new type system, a rebuilt component library and a docs site that doubles as a blueprint for our engineering migration. AI played a big part in making that possible, though maybe not in the way you'd expect.

## What AI did, and what it didn't

AI wasn't the decision maker. Choosing how a brand translates, what a color should mean or even how a selected tab should feel still takes taste and judgment, and those calls stayed with people.

What AI gave us was reach. Engineers used AI agents fluent in our design system to move even our oldest screens onto it, directing the work instead of doing it line by line. I tested every proposed color change on realistic product screens instead of judging swatches in isolation. Agents rebuilt our component documentation and checked it against our design files, detail by detail, in under two weeks. And they took on much of the tedious, repetitive work of rebuilding our Figma library, plus the tools that help designers keep their work consistent.

People making the calls and agents carrying them out at scale is how we rebuilt a design system in the middle of a rebrand. The rest of this post walks through how it came together, starting with the big decisions and getting into the nuts and bolts as it goes.

## Why not just swap colors?

In a product, color isn't just decoration. It tells people what they can click, what's selected and when something went wrong. Our old brand's colors each had a job, and the new brand's colors weren't designed with those jobs in mind.

Our first design system, a fully custom build called DSCO, took shape over the last two to three years and did its job well. Its color system, a two-layer model I'd developed earlier, put raw palette values ("primitives") at the bottom and semantic tokens on top, organized into three groups: **backgrounds, text and borders**. We intentionally avoided component-specific tokens and vague industry names like "surface" or "ink." Instead, each color is defined by its root purpose and how much emphasis it carries.

The core structure was sound, but the palette rules on top of it had become fragile and specific to the old brand. Teal was technically our primary brand color and purple our secondary, yet the interface used them the other way around. Purple meant "you can act on this," like buttons and links. Teal meant "this is active," like a selected tab. Tokens also often named colors directly, and one-offs had piled up.

The new brand doesn't think in those terms. A new purple became the primary color, and the rest of the palette was designed to carry equal weight. No color was an obvious second to take over teal's job, and many already carried meaning, like success or error. It was time for something more brand-agnostic and scalable.

[Placeholder: our core palette? Or a brand guidelines rebrand slice]

Ultimately, I made a call to fork the color system and work out how the new palette could map onto our tokens. One thing led to another, and what started as a seemingly small color quandary turned the rebrand into a chance to rethink the system holistically. A chance to make the new brand the default everywhere, raise the quality bar and set up the next phases of work. It wasn't part of the original plan, but it was our chance to align the growth of our system with the growth of our new brand.

## Working in parallel

The tricky part was time. Engineers had to start rebranding immediately, but the target was still moving. Marketing was still finalizing the brand guidelines, and we were working with them to lock the palette while building the product color system on top of it.

Denys Levada, the engineer dedicated to our design system and the rebrand, and I settled on a transitional approach: a brand-level theming layer that pointed old color references to the new brand's values through aliases. Think of it as a translation layer. Engineering could start refactoring color usage before the final system was decided, without redoing the work later. As components move to the new system and to MUI, the old references are retired gradually.

That decoupling (among others) made the timeline possible. Engineers on different teams moved even legacy screens fully onto the design system while design kept iterating, and they didn't do it all by hand. They built AI agent skills that made LLMs fluent in our design system, plus rebrand-specific workflows and checklists. Much of migrating a legacy screen became something an engineer could direct rather than do line by line.

Knowing what was left was its own problem, so Denys came up with a neat trick: a "pink" brand theme behind a feature flag. When enabled, every surface using design system colors turns pink. Anything that stays its old color hasn't been migrated yet. That helped us turn final checks into an all-hands effort, with people across the org clicking through the platform, hunting for anything that wasn't pink. Some things still need a human eye, and this made it feel more like an Easter egg hunt than a tedious QA pass.

[Placeholder: a product screen with the pink theme on, if the flag still exists lol]

## Rethinking the semantics

With engineering unblocked, the color system itself needed rethinking, and every change had to be judged on real screens, not swatches. I worked out the new system in a color sandbox inside a prototyping environment I'd built before the rebrand, a high-fidelity recreation of Lab2 (our new generation of lab environments). The sandbox shows every color, mapping and contrast ratio on one live canvas, stores brand themes and pushes a proposed palette through the whole environment, so I could see changes on realistic product surfaces instantly.

[Placeholder: shot or GIF of the sandbox, maybe a change propagating?]

The foundation stayed the same, while everything on top of it got a much-needed cleanup:

- **Cleaner structure:** Groupings that had drifted over years of additions were reorganized.
- **Consistent naming:** Color-specific names and one-offs were replaced with one purpose-based convention across Figma and code.
- **Accessibility built in:** Contrast is a common weak spot for design systems, even well-known ones, and for us it isn't a nice-to-have. Our three-group semantic structure does that work up front. Tokens are designed to layer logically, so when they're used as intended, accessibility comes out of the box.
- **A special new selected state:** Rather than force a secondary color, we pair two brand colors for every selected state and invert them between modes (all of which happens at the token level). In light mode a selected tab is dark purple with seafoam text. In dark mode it's seafoam with dark purple text. It's a small twist that infuses some of the playfulness of the new brand into the product in an unexpected way.

[Placeholder: small component shot with selected states in light and dark mode]

Once decisions settle, a one-click export workflow packages everything into the exact variable files the production library expects, in sync with Figma.

## Rebuilding the library

Color wasn't the only debt. A design system is also the library of buttons, menus, tabs and other components that designers and engineers build with, and ours had aged too. DSCO's Figma components were built over time, much of it before agents could work across Figma and code, so naming and construction were inconsistent and small issues had been copied from older components into newer ones.

We're also in the process of migrating our production component library to MUI, so the rebuild was a chance to make props and naming consistent across the system and, where it made sense, with MUI's own API. The Figma library also got a full visual and organizational overhaul, and agents working in Figma were able to tackle much of the tedious variant-by-variant refactor work. The result is CADS, the CodeAI Design System.

[Placeholder: a page from Figma]

Alongside the Figma library, I built **CADS Docs**. It's a live docs site and a fully working MUI component library that matches Figma one-to-one, serving as both a reference and a blueprint for each component's production migration.

Keeping it faithful to Figma is the job of a pixel-parity workflow, which won't let an agent call a component done just because it looks close enough. Before writing any code, the agent turns the Figma spec into a "visual recipe" covering every size, spacing value, radius and border, plus the exact token behind every color, for each variant, state and mode. Then it renders each case in a browser with real hover, focus and press interactions, measures the result against the recipe and the Figma screenshot, and fixes and recaptures until it passes. Any intentional difference has to be flagged and justified. With that loop in place, CADS Docs came together in under two weeks, and the workflow is packaged to drop into our production repo for the MUI migration.

CADS Docs also gives us a safe place to experiment. One example is CADS Motion, a set of experimental micro-interaction recipes that lives there behind a toggle, so I can apply it across the library and try it in prototypes without touching production code.

[Placeholder: CADS Docs component page w/ playground]

A couple of smaller tools for the design team came out of this work too:

- **A Font Awesome plugin for Figma:** lets our design team use icons the way production does (font files, not SVGs), synced with our icon kits through the Font Awesome API. It's the first plugin that serves FA Icons this way in Figma and is [available on Figma Community](https://www.figma.com/community/plugin/1666231663859852134/font-awesome-glyphs).
- **CADS Audit (WIP):** a local Figma plugin that can score how well a design follows CADS, and can even update a design's colors, components and other core style properties to align.

[Placeholder: plugin side by side]

## Where does this leave us?

The work isn't done. The goal is still for Figma to function as our single source of truth, with CADS Docs and the production library in lockstep, and every component migration gets us a step closer. Because so much of the platform now runs on the design system, each of those steps reaches the whole product much faster than it used to.

Whether it's a rebrand, a platform shift or a big migration, the moments that put everything in play at once are worth more than the change that prompted them. The trick is building layers that let everyone keep moving while the foundation shifts, then seizing the opportunity they create to fix what's underneath.
