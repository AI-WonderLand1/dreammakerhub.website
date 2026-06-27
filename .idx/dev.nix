{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.pnpm
    pkgs.nano
    pkgs.git
    pkgs.nvm
  ];
  idx = {
    extensions = [
      "dsznajder.es7-react-js-snippets"
      ,
      "bradlc.vscode-tailwindcss",
      "esbenp.prettier-vscode"
    ];
    workspace = {
      onCreate = {
        # This installs dependencies at the root so the engine and UI are linked
        install = ''
          . "/home/user/.nvm/nvm.sh" --no-use
          nvm install 20.11.0
          nvm use 20.11.0
          npm install --legacy-peer-deps
        '';
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          # FIXED: Switched from pnpm to npm to match the onCreate install command and prevent build-time mismatch
          command = ["npm" "run" "dev" "--prefix" "apps/web" "--" "-p" "$PORT" "-H" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
