import os
import json

def generate_photo_list():
    # Path to the photos directory
    photos_dir = os.path.join(os.path.dirname(__file__), 'out')
    
    # Get all .webp files
    photos = [f for f in os.listdir(photos_dir) if f.endswith('.webp')]
    
    # Sort the files to ensure consistent ordering
    photos.sort()
    
    # Create the output data structure
    photo_data = {
        "photos": photos
    }
    
    # Write to JSON file
    output_path = os.path.join(os.path.dirname(__file__), 'photos.json')
    with open(output_path, 'w') as f:
        json.dump(photo_data, f, indent=2)

if __name__ == '__main__':
    generate_photo_list()
