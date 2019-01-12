import subprocess
import glob
import json
import shutil
import collections
import os
from time import sleep


def load_buckets(url, subdir='.', load_json=None):
    result = {'apps': {}, 'url': url,
              'subdir': subdir if subdir != '.' else None}

    tmp_dir = 'bucket-temp'
    subprocess.check_call(['git', 'clone', '--depth=1', url, tmp_dir])

    for json_file in glob.glob(os.path.join(tmp_dir, subdir, '*.json')):
        with open(json_file, 'r') as file:
            manifest = json.loads(file.read().replace(
                '\r', ' ').replace('\n', ' '))
            result['apps'][os.path.splitext(os.path.basename(json_file))[0]] = {
                k: manifest.get(k) for k in ['version', 'homepage', 'description']}

    json_content = None
    if load_json is not None:
        with open(os.path.join(tmp_dir, load_json), 'r') as file:
            json_content = json.load(
                file, object_pairs_hook=collections.OrderedDict)

    sleep_time = 0.1
    for i in range(10):
        try:
            shutil.rmtree(tmp_dir)
            break
        except PermissionError:
            sleep(sleep_time)  # workaround error in WSL
            sleep_time *= 1.5

    return result, json_content


def main():
    result = {}
    result['main'], bucket_urls = load_buckets(
        'https://github.com/lukesampson/scoop.git', 'bucket', 'buckets.json')

    for bucket in bucket_urls:
        result[bucket], _ = load_buckets(bucket_urls[bucket])

    with open('data.json', 'w') as file:
        json.dump(result, file)


if __name__ == "__main__":
    main()
