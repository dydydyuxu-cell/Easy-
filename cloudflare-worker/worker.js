
export default {
  async fetch(request) {
    return new Response("Easy API Worker is running", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
