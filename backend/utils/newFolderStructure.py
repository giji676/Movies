import os
import shutil

# Path to your downloads folder
DOWNLOADS_DIR = "/var/www/media/downloads"

for entry in os.listdir(DOWNLOADS_DIR):
    id_path = os.path.join(DOWNLOADS_DIR, entry)
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
