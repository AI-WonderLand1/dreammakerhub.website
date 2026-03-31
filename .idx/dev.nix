{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.pnpm
    pkgs.nano
    pkgs.git
  ];
  idx = {
    extensions = [
      "dsznajder.es7-react-js-snippets"
      "bradlc.vscode-tailwindcss"
      "esbenp.prettier-vscode"
    ];
    workspace = {
      onCreate = {
        # This installs dependencies at the root so the engine and UI are linked
        install = "pnpm install";
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          # FIXED: This syntax prevents Next.js from thinking the port is a directory
          command = ["pnpm" "run" "dev" "--prefix" "apps/web" "--" "-p" "$PORT" "-H" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}