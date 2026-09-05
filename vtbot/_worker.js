export default {
  async fetch(request) {
    const url = new URL(request.url);
    return Response.redirect(
      `https://events-3bg.pages.dev${url.pathname}${url.search}`,
      301
    );
  }
};