import { Link } from "react-router-dom"

const desktops = [
  {
    name: "NIGHT SHIFT",
    description: "Creative studio",
    wallpaper:
      "bg-[radial-gradient(circle_at_25%_20%,#f5d0ff,transparent_32%),radial-gradient(circle_at_80%_70%,#6c63ff,transparent_35%),linear-gradient(135deg,#17152c,#40366d)]",
    accent: "bg-[#f1c7ff]",
    icons: ["🎨", "📁", "🎬", "📷"],
  },
  {
    name: "PROJECT 01",
    description: "Design team",
    wallpaper:
      "bg-[radial-gradient(circle_at_70%_20%,#fff2b5,transparent_28%),radial-gradient(circle_at_20%_80%,#ff9e9e,transparent_35%),linear-gradient(135deg,#f7c8a8,#d98989)]",
    accent: "bg-[#fff4c8]",
    icons: ["📐", "📁", "🖼️", "✏️"],
  },
  {
    name: "LOFT 7",
    description: "Indie project",
    wallpaper:
      "bg-[radial-gradient(circle_at_30%_30%,#c5ffdc,transparent_30%),radial-gradient(circle_at_80%_80%,#71b8ff,transparent_35%),linear-gradient(135deg,#234d50,#467c9c)]",
    accent: "bg-[#c8ffe0]",
    icons: ["💻", "📁", "🎵", "⚡"],
  },
]

export function IndexPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-lofty-bg text-lofty-ink">
      {/* NAV */}

      <header className="relative z-50 border-b border-black/10 bg-lofty-bg backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lofty-ink text-sm font-black text-white shadow-lofty-offset-sm">
              L
            </div>

            <span className="text-lg font-black tracking-tighter">LOFTY</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-black/55 md:flex">
            <a href="#customize" className="transition hover:text-black">
              Customize
            </a>
            <a href="#features" className="transition hover:text-black">
              Features
            </a>
            <a href="#teams" className="transition hover:text-black">
              For teams
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-black/55 transition hover:bg-white hover:text-black sm:block"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="rounded-full bg-lofty-ink px-5 py-2.5 text-sm font-bold text-white shadow-lofty-offset-sm transition hover:-translate-y-0.5"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}

        <section className="relative px-6 pb-24 pt-24 md:pt-32">
          <div className="pointer-events-none absolute left-[10%] top-20 h-64 w-64 rounded-full bg-lofty-pink opacity-50 blur-3xl" />
          <div className="pointer-events-none absolute right-[5%] top-40 h-80 w-80 rounded-full bg-lofty-sky opacity-60 blur-3xl" />

          <div className="relative mx-auto max-w-6xl text-center">
            <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-bold tracking-[0.12em] text-black/55 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#72c48b]" />A SHARED
              OPERATING SYSTEM
            </div>

            <h1 className="mx-auto max-w-5xl text-6xl font-black leading-[0.88] tracking-[-0.075em] sm:text-7xl md:text-8xl">
              Build a desktop
              <br />
              <span className="text-[#6575a8]">that's yours.</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-black/55 md:text-xl">
              LOFTY gives your team a shared desktop you can make completely
              your own. Choose the look, arrange the space, add your files and
              bring your people in.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="rounded-2xl bg-lofty-ink px-7 py-4 text-sm font-bold text-white shadow-lofty-offset transition hover:-translate-y-1"
              >
                Create your desktop →
              </Link>

              <a
                href="#customize"
                className="rounded-2xl border border-black/10 bg-white/70 px-7 py-4 text-sm font-bold text-black/60 shadow-sm transition hover:-translate-y-1 hover:bg-white"
              >
                See what's possible
              </a>
            </div>
          </div>

          {/* CUSTOM DESKTOP SHOWCASE */}

          <div id="customize" className="relative mx-auto mt-20 max-w-6xl">
            <div className="mb-5 flex items-center justify-between px-2">
              <div>
                <p className="text-xs font-black tracking-[0.18em] text-black/35">
                  YOUR OS. YOUR RULES.
                </p>

                <p className="mt-1 text-sm font-semibold text-black/50">
                  Every LOFTY can look completely different.
                </p>
              </div>

              <div className="hidden text-xs font-bold text-black/35 sm:block">
                03 / 03
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {desktops.map((desktop, index) => (
                <div
                  key={desktop.name}
                  className={[
                    "group relative overflow-hidden rounded-[26px] border-[5px] border-white bg-white shadow-lofty-lg transition duration-500 hover:-translate-y-2",
                    index === 1 ? "md:-translate-y-5" : "",
                  ].join(" ")}
                >
                  {/* Window bar */}

                  <div className="flex h-10 items-center justify-between border-b border-black/10 bg-linear-to-b from-white to-lofty-window-dark px-3">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-lofty-pink" />
                      <span className="h-2.5 w-2.5 rounded-full bg-lofty-yellow-muted" />
                      <span className="h-2.5 w-2.5 rounded-full bg-lofty-green-soft" />
                    </div>

                    <span className="text-[9px] font-black tracking-wider text-black/30">
                      LOFTY
                    </span>
                  </div>

                  {/* Desktop */}

                  <div
                    className={`relative aspect-[0.82] ${desktop.wallpaper} p-5`}
                  >
                    {/* icons */}

                    <div className="grid grid-cols-2 gap-5">
                      {desktop.icons.map((icon, iconIndex) => (
                        <div
                          key={iconIndex}
                          className="flex flex-col items-center gap-1.5"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/75 text-xl shadow-lg backdrop-blur transition group-hover:-translate-y-1">
                            {icon}
                          </div>

                          <span className="text-[9px] font-bold text-white drop-shadow-md">
                            {["Projects", "Files", "Media", "Notes"][iconIndex]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Custom window */}

                    <div className="absolute bottom-5 left-5 right-5 overflow-hidden rounded-xl border border-white/60 bg-white/75 shadow-xl backdrop-blur-xl">
                      <div className="border-b border-black/5 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-black/60">
                            {desktop.name}
                          </span>

                          <span className="text-[9px] text-black/30">×</span>
                        </div>
                      </div>

                      <div className="p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-7 w-7 rounded-lg ${desktop.accent}`}
                          />

                          <div>
                            <div className="h-1.5 w-20 rounded bg-black/15" />
                            <div className="mt-1 h-1.5 w-12 rounded bg-black/8" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-black/5 bg-white px-4 py-3">
                    <p className="text-xs font-black">{desktop.name}</p>
                    <p className="mt-0.5 text-[10px] text-black/40">
                      {desktop.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-sm font-medium text-black/35">
              Same OS. Completely different worlds.
            </p>
          </div>
        </section>

        {/* CUSTOMIZATION */}

        <section className="border-y border-black/10 bg-white/45 px-6 py-28">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-16 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-xs font-black tracking-[0.2em] text-black/35">
                  MAKE IT YOURS
                </p>

                <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl">
                  Your desktop
                  <br />
                  should feel
                  <br />
                  <span className="text-lofty-blue">like your team.</span>
                </h2>

                <p className="mt-7 max-w-lg leading-7 text-black/55">
                  LOFTY isn't one rigid workspace. Customize the environment
                  around the way your group actually works.
                </p>
              </div>

              {/* Customization controls */}

              <div className="rounded-[28px] border border-black/10 bg-lofty-window p-4 shadow-[0_25px_60px_rgba(30,30,30,0.12)]">
                <div className="overflow-hidden rounded-[20px] border-4 border-white bg-lofty-blue-soft shadow-lg">
                  <div className="flex h-10 items-center justify-between bg-linear-to-b from-white to-[#e8e9e8] px-3">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ee9999]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#efd08c]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-lofty-maximize" />
                    </div>

                    <span className="text-[9px] font-black text-black/30">
                      DESKTOP SETTINGS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-5">
                    {[
                      ["Wallpaper", "🖼️"],
                      ["Theme", "◐"],
                      ["Icons", "▦"],
                      ["Layout", "⊞"],
                      ["Windows", "▣"],
                      ["Profile", "●"],
                    ].map(([name, icon]) => (
                      <div
                        key={name}
                        className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 p-3 backdrop-blur"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm shadow-sm">
                          {icon}
                        </div>

                        <span className="text-xs font-bold text-black/60">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/20 bg-black/10 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/80">
                        CUSTOMIZATION
                      </span>

                      <span className="rounded-full bg-white/80 px-2 py-1 text-[8px] font-black text-black/50">
                        ENABLED
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}

        <section id="features" className="px-6 py-28">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-black tracking-[0.2em] text-black/35">
                EVERYTHING IN ONE PLACE
              </p>

              <h2 className="mt-5 text-4xl font-black tracking-[-0.06em] md:text-5xl">
                It works like a computer.
                <br />
                Because it is one.
              </h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: "🖥️",
                  title: "Custom desktops",
                  text: "Create the environment. Change the wallpaper, layout, visual style and whatever else makes it yours.",
                },
                {
                  icon: "📁",
                  title: "Files & folders",
                  text: "Keep your actual project materials inside the same environment your team inhabits.",
                },
                {
                  icon: "👥",
                  title: "Shared by default",
                  text: "Invite people into your desktop and control what they can access with flexible roles.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[28px] border border-black/10 bg-white/60 p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-white"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/5 bg-[#ecece8] text-2xl">
                    {feature.icon}
                  </div>

                  <h3 className="mt-7 text-xl font-black tracking-tight">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-black/50">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TEAMS */}

        <section id="teams" className="px-6 pb-28">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-lofty-ink-soft px-8 py-20 text-white md:px-16">
            <div className="grid gap-16 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-xs font-black tracking-[0.2em] text-white/35">
                  FOR CREATIVE TEAMS
                </p>

                <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl">
                  Stop working
                  <br />
                  in someone
                  <br />
                  else's interface.
                </h2>

                <p className="mt-7 max-w-lg leading-7 text-white/50">
                  Give your studio, project or team an environment with its own
                  personality — while keeping the collaboration tools underneath
                  it serious.
                </p>

                <Link
                  to="/register"
                  className="mt-8 inline-flex rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-lofty-ink-soft transition hover:-translate-y-1"
                >
                  Build your workspace →
                </Link>
              </div>

              <div className="relative">
                <div className="rotate-3 rounded-3xl border-[5px] border-white/80 bg-lofty-purple p-4 shadow-2xl">
                  <div className="rounded-2xl bg-linear-to-br from-[#6e668f] via-[#a990b2] to-[#e1b7ac] p-5">
                    <div className="flex justify-between">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-white/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white/50" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
                      </div>

                      <span className="text-[9px] font-black text-white/70">
                        STUDIO.OS
                      </span>
                    </div>

                    <div className="mt-8 grid grid-cols-4 gap-3">
                      {["🎨", "📁", "🎬", "📷", "💬", "🎵", "📄", "⚙️"].map(
                        (icon, i) => (
                          <div
                            key={i}
                            className="flex aspect-square items-center justify-center rounded-xl bg-white/70 text-lg shadow-lg"
                          >
                            {icon}
                          </div>
                        ),
                      )}
                    </div>

                    <div className="mt-5 rounded-xl bg-white/70 p-4 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black text-black/35">
                            CURRENT PROJECT
                          </p>

                          <p className="mt-1 text-xs font-black text-black/65">
                            New identity
                          </p>
                        </div>

                        <span className="text-lg">↗</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-5 -left-5 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white/70 backdrop-blur-xl">
                  Built by your team
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}

        <section className="relative px-6 py-32 text-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lofty-blue-pale opacity-60 blur-3xl" />

          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-lofty-ink text-xl font-black text-white shadow-[5px_5px_0_rgba(0,0,0,0.12)]">
              L
            </div>

            <h2 className="mx-auto mt-8 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.07em] md:text-7xl">
              Make a place
              <br />
              <span className="text-lofty-blue">of your own.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-black/45">
              Your desktop. Your people. Your way of working.
            </p>

            <Link
              to="/register"
              className="mt-9 inline-flex rounded-2xl bg-lofty-ink px-8 py-4 text-sm font-bold text-white shadow-lofty-offset transition hover:-translate-y-1"
            >
              Create your LOFTY →
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}

      <footer className="border-t border-black/10 bg-white/40 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 py-8 text-xs text-black/35 sm:flex-row">
          <div className="flex items-center gap-2 font-black text-black/60">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lofty-ink text-[10px] text-white">
              L
            </div>
            LOFTY
          </div>

          <p>© 2026 LOFTY</p>
        </div>
      </footer>
    </div>
  )
}
