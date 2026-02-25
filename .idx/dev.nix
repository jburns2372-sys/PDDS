{ pkgs, ... }: {
  # See https://developers.google.com/idx/guides/customize-idx-env
  # for more details on customizing your environment.
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
  ];
  previews = {
    enable = true;
    previews = {
      web = {
        command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
        manager = "web";
      };
    };
  };
  workspace = {
    onCreate = [
      "npm install"
    ];
    onStart = [
      # The following command will be run in the background when your workspace starts
      # "npm run genkit:watch &"
    ];
  };
}
