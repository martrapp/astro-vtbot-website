<h1>Forced Traversals</h1>

Making  every visit of a already known page a traversal through the  browser's history is done with a simple modification of the [previous demo](/signal-demo/pageOrder/blog/):

```astro title="BaseHead.astro"
<TurnSignal selector="nav .internal-links a" forceTraversal/>
```
Click a bit through the **Home**, **Blog**, and **About** links in the header and check that the browser history will stop growing once you saw them all.

Ah, you are annoyed by the fact that clicking the current page slides it in from the right? We can fix that in the [next demo](/signal-demo/same/blog/) (or [return to the overview](/signal-demo/)).


