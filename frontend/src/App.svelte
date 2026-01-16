<script>
  import { onMount } from "svelte";
  import { fly, fade, scale } from "svelte/transition";
  import "./app.css";

  let currentAddress = null;
  let emails = [];
  let selectedEmail = null;
  let eventSource = null;
  let copied = false;
  let loading = true;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  // Generate or retrieve address
  async function getAddress() {
    const saved = localStorage.getItem("disposable_email");
    if (saved) {
      currentAddress = saved;
      connectSSE(saved.split("@")[0]);
      await fetchEmails(saved.split("@")[0]);
      loading = false;
    } else {
      await generateAddress();
    }
  }

  async function generateAddress() {
    loading = true;
    try {
      const res = await fetch(`${API_URL}/address`);
      const data = await res.json();
      currentAddress = data.address;
      localStorage.setItem("disposable_email", currentAddress);

      emails = [];
      selectedEmail = null;
      if (eventSource) eventSource.close();

      connectSSE(currentAddress.split("@")[0]);
    } catch (e) {
      console.error("Failed to generate address", e);
    } finally {
      loading = false;
    }
  }

  async function fetchEmails(inboxId) {
    try {
      const res = await fetch(`${API_URL}/inbox/${inboxId}`);
      const data = await res.json();
      emails = data.emails || [];
    } catch (e) {
      console.error("Failed to fetch emails", e);
    }
  }

  function connectSSE(inboxId) {
    if (eventSource) eventSource.close();
    eventSource = new EventSource(`${API_URL}/events?inbox=${inboxId}`);

    eventSource.onmessage = () => {}; // Keep alive

    eventSource.addEventListener("new_email", (e) => {
      const newEmail = JSON.parse(e.data);
      if (!emails.find((em) => em.id === newEmail.id)) {
        emails = [newEmail, ...emails];
        new Audio(
          "https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3",
        )
          .play()
          .catch(() => {});
      }
    });

    eventSource.onerror = () => eventSource.close();
  }

  async function selectEmail(id) {
    try {
      const res = await fetch(`${API_URL}/message/${id}`);
      selectedEmail = await res.json();
    } catch (e) {
      console.error("Failed to load email", e);
    }
  }

  function deleteInbox() {
    if (confirm("Are you sure you want to delete this address?")) {
      localStorage.removeItem("disposable_email");
      currentAddress = null;
      emails = [];
      selectedEmail = null;
      if (eventSource) eventSource.close();
      generateAddress();
    }
  }

  function copyAddress() {
    if (!currentAddress) return;
    navigator.clipboard.writeText(currentAddress);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  onMount(() => {
    getAddress();
  });
</script>

<main
  class="min-h-screen w-full bg-slate-100 font-sans text-slate-800 flex flex-col"
>
  <!-- Top Dark Header Section -->
  <div class="bg-slate-900 text-white pb-12 shadow-lg relative overflow-hidden">
    <!-- Decoration -->
    <div
      class="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none"
    >
      <div
        class="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute top-24 -left-24 w-72 h-72 bg-blue-500 rounded-full blur-3xl"
      ></div>
    </div>

    <!-- Navbar -->
    <nav
      class="relative container mx-auto px-4 py-6 flex justify-between items-center z-10"
    >
      <div class="flex items-center gap-2 font-bold text-xl tracking-tight">
        <div
          class="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-slate-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5"
          >
            <path
              d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"
            />
            <path
              d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"
            />
          </svg>
        </div>
        <span>TEMP<span class="text-emerald-400">MAIL</span></span>
      </div>
      <div class="flex gap-4 items-center">
        <button
          class="hidden md:block text-slate-400 text-sm font-medium hover:text-white transition-colors"
          >Premium</button
        >
        <button
          class="bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20"
        >
          API Access
        </button>
      </div>
    </nav>

    <!-- Main Address Area -->
    <div
      class="relative z-10 container mx-auto px-4 mt-8 flex flex-col items-center text-center"
    >
      <h2
        class="text-slate-400 text-sm font-medium mb-4 uppercase tracking-widest"
      >
        Your Temporary Email Address
      </h2>

      <div class="relative w-full max-w-2xl">
        <!-- Glowing Border Effect -->
        <div
          class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-25"
        ></div>

        <div
          class="relative bg-slate-800 rounded-xl p-2 flex items-center shadow-2xl border border-slate-700"
        >
          {#if loading}
            <div
              class="flex-1 h-12 bg-slate-700/50 rounded animate-pulse m-2"
            ></div>
          {:else}
            <div class="flex-1 px-4 py-3 text-center sm:text-left">
              <input
                readonly
                value={currentAddress}
                class="w-full bg-transparent border-none focus:ring-0 text-white text-lg sm:text-2xl font-mono text-center sm:text-left outline-none"
              />
            </div>
            <div class="flex items-center gap-2 pr-2">
              <button
                class="bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg p-3 transition-colors flex items-center gap-2 font-semibold shadow-lg shadow-emerald-500/20 group relative"
                on:click={copyAddress}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  /></svg
                >
                <span class="hidden sm:inline">Copy</span>
                {#if copied}
                  <div
                    class="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-3 rounded shadow-lg"
                    in:fly={{ y: 5 }}
                  >
                    Copied!
                  </div>
                {/if}
              </button>
            </div>
          {/if}
        </div>
      </div>

      <p
        class="text-slate-500 text-xs sm:text-sm mt-8 max-w-xl leading-relaxed"
      >
        Forget about spam, advertising mailings, hacking and attacking robots.
        Keep your real mailbox clean and secure.
      </p>
    </div>
  </div>

  <!-- Action Bar -->
  <div class="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
    <div
      class="container mx-auto px-4 py-4 flex flex-wrap justify-center gap-4"
    >
      <button
        class="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2.5 rounded-full text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-95"
        on:click={copyAddress}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          /></svg
        >
        Copy
      </button>
      <button
        class="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2.5 rounded-full text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-95"
        on:click={() => fetchEmails(currentAddress.split("@")[0])}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          /></svg
        >
        Refresh
      </button>
      <button
        class="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2.5 rounded-full text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-95"
        on:click={generateAddress}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          /></svg
        >
        Change
      </button>
      <button
        class="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2.5 rounded-full text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-95 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
        on:click={deleteInbox}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          /></svg
        >
        Delete
      </button>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="flex-1 container mx-auto px-4 py-8 w-full max-w-5xl">
    {#if selectedEmail}
      <!-- Email View -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        in:fly={{ y: 20 }}
      >
        <div
          class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center"
        >
          <button
            on:click={() => (selectedEmail = null)}
            class="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              /></svg
            >
            Back to Inbox
          </button>
          <span class="text-xs text-slate-400"
            >{new Date(selectedEmail.created_at).toLocaleString()}</span
          >
        </div>
        <div class="p-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-2">
            {selectedEmail.subject || "(No Subject)"}
          </h2>
          <div class="text-sm text-slate-500 mb-8 flex gap-2">
            From: <span class="text-slate-900 font-medium"
              >{selectedEmail.from_addr}</span
            >
          </div>

          <div
            class="bg-slate-50 rounded-lg border border-slate-200 min-h-[300px] overflow-hidden"
          >
            {#if selectedEmail.html_body}
              <iframe
                srcdoc={selectedEmail.html_body}
                title="Email Content"
                class="w-full h-full min-h-[500px] border-none"
                sandbox="allow-popups allow-popups-to-escape-sandbox"
              ></iframe>
            {:else}
              <div
                class="p-6 whitespace-pre-wrap font-mono text-sm text-slate-700"
              >
                {selectedEmail.text_body}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <!-- Inbox Table -->
      <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]"
      >
        <div
          class="bg-slate-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-wider flex"
        >
          <div class="w-1/4">Sender</div>
          <div class="w-1/2">Subject</div>
          <div class="w-1/4 text-right">View</div>
        </div>

        {#if emails.length === 0}
          <div
            class="flex flex-col items-center justify-center py-24 text-center"
          >
            <div
              class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                /></svg
              >
            </div>
            <h3 class="text-xl font-medium text-slate-700">
              Your inbox is empty
            </h3>
            <p class="text-slate-400 mt-2 text-sm">
              Waiting for incoming emails
            </p>
          </div>
        {:else}
          <div class="divide-y divide-slate-100">
            {#each emails as email (email.id)}
              <div
                class="flex px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group items-center"
                on:click={() => selectEmail(email.id)}
              >
                <div class="w-1/4 font-medium text-slate-900 truncate pr-4">
                  {email.from_addr}
                </div>
                <div
                  class="w-1/2 text-slate-600 truncate pr-4 font-normal group-hover:text-emerald-600 transition-colors"
                >
                  {email.subject || "(No Subject)"}
                  <span
                    class="text-xs text-slate-400 ml-2 border border-slate-200 rounded px-1"
                    >{email.snippet}</span
                  >
                </div>
                <div class="w-1/4 text-right">
                  <span
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      /></svg
                    >
                  </span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Ads/Footer placeholder -->
  <div class="container mx-auto px-4 py-8 text-center text-xs text-slate-400">
    &copy; 2026 Disposable Email Service. Open Source.
  </div>
</main>

<style>
  /* Removed custom class to rely purely on utility classes for simplicity */
</style>
