import subprocess
import glob
import json
import shutil
import collections
import os
from time import sleep
import stat


def rmtree_onerror(func, path, exc_info):
    if os.access(path, os.W_OK):
        # pylint: disable=E0704
        raise
    os.chmod(path, stat.S_IWUSR)
    func(path)


def load_buckets(url, load_json=None):
    tmp_dir = 'bucket-temp'
    subprocess.check_call(['git', 'clone', '--depth=1', url, tmp_dir])
    subdir = 'bucket'
    if not os.path.isdir(os.path.join(tmp_dir, subdir)):
        subdir = None
    result = {'apps': {}, 'url': url, 'subdir': subdir}

    for json_file in sorted(glob.glob(os.path.join(tmp_dir, subdir or '', '*.json'))):
        with open(json_file, 'r', encoding='utf-8') as file:
            try:
                manifest = json.loads(file.read().replace(
                    '\r', ' ').replace('\n', ' ').replace('\t', ' '))
                result['apps'][os.path.splitext(os.path.basename(json_file))[0]] = {
                    k: manifest.get(k) for k in ['version', 'homepage', 'description']}
            except:
                print("Error on processing manifest:", json_file)
                raise

    json_content = None
    if load_json is not None:
        with open(os.path.join(tmp_dir, load_json), 'r') as file:
            json_content = json.load(
                file, object_pairs_hook=collections.OrderedDict)

    shutil.rmtree(tmp_dir, onerror=rmtree_onerror)

    return result, json_content


def main():
    result = {}
    result['main'], bucket_urls = load_buckets(
        'https://github.com/lukesampson/scoop.git', 'buckets.json')

    for bucket in bucket_urls:
        result[bucket], _ = load_buckets(bucket_urls[bucket])

    with open('additional_buckets.json', 'r') as file:
        bucket_urls = json.load(
            file, object_pairs_hook=collections.OrderedDict)
        for bucket in bucket_urls:
            result[bucket], _ = load_buckets(bucket_urls[bucket])

    with open('data.json', 'w') as file:
        json.dump(result, file)


if __name__ == "__main__":
    main()
