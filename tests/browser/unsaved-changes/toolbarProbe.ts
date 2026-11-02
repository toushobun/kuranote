type ProbeWindow = Window & {
  probeMounts?: number;
  probeUnmounts?: number;
  navigation?: EventTarget & {
    currentEntry?: { index: number };
    entries?: () => Array<{ url: string; index: number }>;
  };
};

/** 为工具栏验收暴露只读 DOM 记录，不从验证代码触发后退或前进。 */
export function installToolbarProbe(output: HTMLElement) {
  const formIds = new WeakMap<Element, number>();
  let nextFormId = 0;
  let pending = false;
  const render = () => {
    pending = false;
    const probe = window as ProbeWindow;
    const snapshot = {
      href: location.href,
      scrollX,
      scrollY,
      mounts: probe.probeMounts ?? 0,
      unmounts: probe.probeUnmounts ?? 0,
      historyLength: history.length,
      historyIndex: probe.navigation?.currentEntry?.index ?? null,
      historyEntries:
        probe.navigation
          ?.entries?.()
          .map(({ url, index }) => ({ url, index })) ?? [],
      marker:
        (
          history.state as {
            kuranoteUnsavedChanges?: { position: string };
          } | null
        )?.kuranoteUnsavedChanges?.position ?? null,
      rscRequests: performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((name) => name.includes("_rsc=")),
      forms: [...document.querySelectorAll("form")].map((form) => {
        if (!formIds.has(form)) formIds.set(form, ++nextFormId);
        return {
          id: form.id,
          instance: formIds.get(form),
          fields: [...new FormData(form).entries()].filter(
            (entry) => !entry[0].startsWith("$ACTION"),
          ),
        };
      }),
      dialogs: [...document.querySelectorAll<HTMLElement>(".MuiModal-root")]
        .filter((node) => getComputedStyle(node).visibility !== "hidden")
        .map((node) => ({
          title: node.querySelector("h2, h6")?.textContent ?? "",
          zIndex: getComputedStyle(node).zIndex,
          bodyPortal: node.parentElement === document.body,
          scrollTop:
            node.querySelector(".MuiDialogContent-root")?.scrollTop ?? 0,
        })),
    };
    output.textContent = JSON.stringify(snapshot);
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(render);
  };
  const mutations = new MutationObserver((records) => {
    if (records.some((record) => !output.contains(record.target))) schedule();
  });
  mutations.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  });
  const resources = new PerformanceObserver(schedule);
  resources.observe({ type: "resource", buffered: true });
  for (const event of ["popstate", "scroll", "input", "click"])
    window.addEventListener(event, schedule, true);
  const navigation = (window as ProbeWindow).navigation;
  navigation?.addEventListener("currententrychange", schedule);
  schedule();
  return () => {
    navigation?.removeEventListener("currententrychange", schedule);
    mutations.disconnect();
    resources.disconnect();
    for (const event of ["popstate", "scroll", "input", "click"])
      window.removeEventListener(event, schedule, true);
  };
}
