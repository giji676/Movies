import os
import shutil

# Path to your downloads folder
from dotenv import load_dotenv

ENV_FILE = os.environ.get("DJANGO_ENV_FILE", ".env.production")
load_dotenv(ENV_FILE)
DOWNLOAD_PATH  = os.environ.get("DJANGO_SECRET_KEY")
if not DOWNLOAD_PATH:
    print("no download path")
    exit()

for entry in os.listdir(DOWNLOAD_PATH):
    id_path = os.path.join(DOWNLOAD_PATH, entry)
    if not os.path.isdir(id_path):
        continue  # skip non-folder files

    # Create 'torrent' folder inside the ID folder
    torrent_path = os.path.join(id_path, "torrent")
    os.makedirs(torrent_path, exist_ok=True)

    # Move everything else into torrent/
    for item in os.listdir(id_path):
        item_path = os.path.join(id_path, item)
        if item == "torrent":
            continue  # skip the torrent folder itself
        dest_path = os.path.join(torrent_path, item)
        # Move the folder or file
        shutil.move(item_path, dest_path)
        print(f"Moved: {item_path} → {dest_path}")

print("All ID folders processed!")
