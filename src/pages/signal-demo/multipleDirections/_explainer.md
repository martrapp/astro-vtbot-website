<h1>Back is Back</h1>

This demo ony differs in two lines from [the previous one](/signal-demo/forwardOnly/blog/):

```astro title="BaseHead" ins={2,5}
---
import TurnSignal from "astro-vtbot/components/TurnSignal.astro";
---
...
<TurnSignal />
...
```
Now clicking **Home** or **About** in the header above and then using the browsers back button slides in the page from the left.

The `<TurnSignal />` generates the same `data-astro-transition="back"` values as Astro's `<ClientRouter />` component, but without the overhead of the client side router. With that information, the CSS generated by `transition:animate` can again work in both directions.

The `<TurnSignal />` also generates view transition types that can be used with the `:active-view-transition-type()` pseudo-classes. For [more details](https://vtbag.pages.dev/tools/turn-signal/#configuration-and-usage) visit the @vtbag pages.

On this page, all clicks on links in the header generate forward animations. Wouldn't it be nice to have **Home** to the left of **Blog** and **About** to the right?

Let's do this in the [next demo](/signal-demo/pageOrder/blog/) (or [return to the overview](/signal-demo/)).
