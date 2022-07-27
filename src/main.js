import { createApp } from "vue";
import { createPinia } from "pinia";
import { autoAnimatePlugin } from "@formkit/auto-animate/vue";

import App from "./App.vue";
import router from "./router";
import { socketIoPlugin } from "./plugins/socket.io";
import "./index.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(socketIoPlugin, {
  url: import.meta.env.VITE_WS_URL,
});
app.use(autoAnimatePlugin);
app.mount("#app");
