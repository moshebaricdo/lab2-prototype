# How AI helped us turn our rebrand into a stronger design system

*By Moshe Bari, Senior Product Designer*

When the new CodeAI brand started to land, we had a matter of weeks to roll it out across the entirety of our product. Sounds simple enough: a new logo, new type and some new colors. But it's no small task for a sprawling platform built over more than a decade, with newer surfaces mostly built on our design system, older ones that predate it, and plenty of mixed-up screens in between.

From a design standpoint, the plan (at first) was simple: swap some old color values for the new ones and move on. It only took a handful of hex code updates to see things weren't going to slot in that neatly.

The new colors themselves weren't the problem, we were trying to fit them into a system that had built up around the old ones and carried the kind of debt that can be easy to miss. That's largely because design systems in practice often grow one decision at a time, and sometimes in a vacuum. As this work began, we quickly realized that moments that put everything in the system into play at once, like a rebrand, don't come along often. So instead of just repainting our product, we used this opportunity to start fixing our foundations.

Not everyone was sure we could pull this off in the time we had, but we shipped it and came out with a stronger, future-ready design system. Along with the new brand, we now have a stronger color system, a new type system, a rebuilt component library, agentic workflows, better documentation, and more. AI was a big part of making that possible.

## The AI of it all

Choosing how a brand translates to a product system (what a color should mean, how a selected tab should look) still takes the same taste and judgment it always has, and those calls stayed with our (human) team.

What AI gave us was reach. It was our force multiplier. Engineers used AI agents fluent in our design system to move some of our oldest surfaces (we're talking HAML) onto the design system, directing the work instead of doing it line by line. In parallel, with AI, I created a sandbox environment where I could rapidly test every proposed color change on one-to-one product screens instead of judging them in isolation. Agents rebuilt our component documentation and checked it against our design files, pixel by pixel, in under two weeks. And they took on much of the tedious, repetitive work of rebuilding and organizing our Figma library, and helped build the tools that keep our designers' work consistent.

People making the calls and agents carrying them out at scale is how we were able to rebuild a design system in the middle of a rebrand.

## Why not just swap colors?

Our first design system, a fully custom build called DSCO, took shape over the last two to three years and did its job well. Its color system, a two-layer model I'd developed earlier, put raw palette values ("primitives") at the bottom and semantic tokens on top, organized into three groups: **backgrounds, text and borders**. We intentionally avoided common patterns like component-specific tokens and vague industry names like "surface" or "ink." Instead, each color is defined by its root purpose and how much emphasis it carries.

The core structure was sound, but the palette rules and naming conventions on top of it had become fragile and specific to the old brand. Teal was technically our primary brand color and purple our secondary, yet the interface often used them the other way around. Purple meant "you can act on this," like buttons and links. Teal meant "this is active," like a selected tab. Tokens also often named colors directly, and one-offs had piled up.

The new brand doesn't think in those terms. A new purple became the primary color, and the rest of the palette was designed to carry equal weight. No color was an obvious second to take over teal's job, and many already carried meaning, like success or error. It was time for something more brand-agnostic and scalable.

[Placeholder: our core palette? Or a brand guidelines rebrand slice]

Ultimately, I made a call to fork the color system and work out how the new palette could map onto our tokens. That fork is where the bigger rethink began: making the new brand the default everywhere, raising the quality bar and setting up the next phases of work. It wasn't part of the original plan, but it was our chance to align the growth of our system with the growth of our new brand.

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

Color wasn't the only debt. Our proprietary component library, the building blocks that designers and engineers work with, had grown piece by piece, and mostly before agents could work across Figma and code. Naming and construction were inconsistent, and small issues had been copied from older components into newer ones.

We're also in the process of migrating our production library to MUI, so the rebuild was a chance to make props and naming consistent across the system and, where it made sense, with MUI's own API. The Figma library got a full visual and organizational overhaul, with agents handling much of the tedious variant-by-variant refactoring. The result is CADS, the CodeAI Design System.

[Placeholder: a page from Figma]

Alongside it, I built **CADS Docs**, a live docs site and fully working MUI component library that matches Figma one-to-one. It serves as both a reference and a blueprint for each component's production migration.

A pixel-parity workflow keeps it faithful to Figma, and it doesn't let an agent call a component done just because it looks close enough or the code looks right. The agent first turns the Figma spec into a "visual recipe" of every size, spacing value, radius, border and color token, for each variant, state and mode. It then renders each case in a browser with real hover, focus and press interactions, measures the result against the recipe and Figma, and fixes and recaptures until it passes. Intentional differences have to be flagged and justified. With that loop in place, CADS Docs came together in under two weeks, and the workflow is ready to drop into our production repo for the MUI migration.

CADS Docs is also gives me a place to experiment at the library level. One example is CADS Motion, a set of experimental micro-interaction recipes, lives there behind a flag, so I can try it across the library and in prototypes without touching production code.

[Placeholder: CADS Docs component page w/ playground]

A couple of smaller tools for the design team came out of this work too:

- **A Font Awesome plugin for Figma:** lets designers use icons the way production does (font files, not SVGs), synced with our icon kits through the Font Awesome API. It's the first plugin to serve FA icons this way in Figma and is [available on Figma Community](https://www.figma.com/community/plugin/1666231663859852134/font-awesome-glyphs).
- **CADS Audit (WIP):** a local Figma plugin that scores how well a design follows CADS and can even update its colors, components and other core styles to match.

[Placeholder: plugin side by side]

## Where does this leave us?

The work isn't done. The goal is still for Figma to function as our single source of truth, with CADS Docs and the production library in lockstep, and every component migration gets us a step closer. Because so much of the platform now runs on the design system, each of those steps reaches the whole product much faster than it used to.

Whether it's a rebrand, a platform shift or a big migration, the moments that put everything in play at once are rare chances to improve far more than just what's changing. The trick is building layers that let everyone keep moving while the foundation shifts, then seizing the opportunity they create to fix what's underneath.

That's also where AI changed the math for us. It didn't decide what our brand should mean in a product, but it let our team test, build and document at a scale our timeline wouldn't otherwise have allowed. The judgment is still ours. AI just meant we didn't have to choose between fixing what's underneath and shipping in the time we had.
