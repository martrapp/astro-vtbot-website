<h1>Page Order</h1>

To enable the `<TurnSignal />` to automatically derive directions from the order of your pages your have to specify your sequence of pages.  This is done using a CSS selector that enumerates all your pages. Most often this can be done by selecting the anchors inside a navigation bar. In this example the selector does just that by adding a property to the  [previous demo](/signal-demo/multipleDirections/blog/):

```astro title="BaseHead.astro"
<TurnSignal selector="nav .internal-links a" />
```
Here the `internal-links` class ensures that we only target Home, Blog, and About - and not the other links of the header. See also the [documentation of the properties](/library/TurnSignal/#properties).

Using the selector, the header links are now ordered as: 1 = **Home**, 2 = **Blog**, 3 = **About**.
Navigating to **Home** triggers a backward transition, while navigating to **About** triggers a forward transition. Going to **Blog** will display a backward transition if coming from **About**. Otherwise, it will show a forward transition.

There are only three pages in this example, but as the user navigates, history entries will accumulate. Instead of just providing the visual impression of sliding left and right, how about replacing navigation to an already visited page with an equivalent history traversal? This way, the experience matches the visual cues.

Let's do this in the [next demo](/signal-demo/forcedTraversal/blog/) (or [return to the overview](/signal-demo/)).


