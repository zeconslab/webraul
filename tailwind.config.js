/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './js/**/*.js',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary":          "rgb(var(--primary-rgb) / <alpha-value>)",
                "accent":           "rgb(var(--accent-rgb) / <alpha-value>)",
                "purple-acc":       "#A78BFA",
                "bg-base":          "var(--bg-base)",
                "bg-surface":       "var(--bg-surface)",
                "bg-card":          "var(--bg-card)",
                "bg-elevated":      "var(--bg-elevated)",
                "text-base":        "var(--text-base)",
                "text-secondary":   "var(--text-secondary)",
                "text-muted":       "var(--text-muted)",
                "border-subtle":    "var(--border)",
                "border-bright":    "var(--border-bright)",
                "terminal-green":   "var(--terminal-green)",
                "background-light": "#f6f6f8",
                "background-dark":  "#070B14",
                "accent-cyan":      "rgb(var(--accent-rgb) / <alpha-value>)",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"],
                "mono":    ["JetBrains Mono", "monospace"],
                "body":    ["Inter", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg":      "1rem",
                "xl":      "1.5rem",
                "full":    "9999px",
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
}
