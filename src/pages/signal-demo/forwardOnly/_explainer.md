<h1>Astro + Native Cross-Document View-Transitions &rarr; No Backward Animations</h1>

This demo shows a first (incomplete) step to enable **native cross-document view transitions** on an Astro site. Other demos will improve the situation step by step. See the link at the bottom of the page or the [overview](/signal-demo/).


These pages might look familiar to you, seasoned astronaut! It's because they are based on the blog template you can select when running `npm create astro`.

What got changed?
1. Obviously, the demo content got replaced.
1. All `<main>` tags include a `transition:animate="slide"` directive, generating Astro's default CSS for sliding view transition animations.
1. This demo **does not use the `<ViewTransitions/>`** component. To activate native cross-document view transitions, the following code was added to the end of `BaseHead.astro`.

```astro
<style is:global>
@view-transition {
  navigation: auto
}
</style>
```
Click on the **Home**, **Blog**, or **About** links in the header of this page. You'll see the content slide in smoothly from the right, **even when using the browser's back button**. No matter what, Astro's default backward animation won't activate.

Let's improve this in the [next demo](/signal-demo/multipleDirections/blog/) (or [return to the overview](/signal-demo/)).
