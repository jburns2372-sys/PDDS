{ pkgs, ... }: {
  channel = "stable-23.11";
  
  packages = [
    pkgs.nodejs_20
  ];
  
  idx = {
    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
    };
    
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}