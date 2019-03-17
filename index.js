function getSettings(key) {
	try {
		return JSON.parse(localStorage.getItem(key))
	} catch (e) { }
	return null
}

function putSettings(key, value) {
	try {
		return localStorage.setItem(key, JSON.stringify(value))
	} catch (e) { }
}

void async function () {
	const disabledBuckets = getSettings('disabledBuckets') || {}

	const appsDiv = document.getElementById('apps')
	const appTemplate = document.getElementById('app-template')

	const data = await (await fetch('data.json')).json()
	for (const bucket in data) {
		if (disabledBuckets[bucket]) continue
		const { url, subdir, apps } = data[bucket]
		const prefix = url.replace(/.git$/, '') + '/blob/master/' +
			(subdir ? subdir + '/' : '')
		const bucketLabel = document.createElement('div')
		appsDiv.appendChild(bucketLabel)
		bucketLabel.classList.add('bucket')
		bucketLabel.textContent = bucket

		for (const app in apps) {
			const { version, description, homepage } = apps[app]
			const node = document.importNode(appTemplate.content, true).firstElementChild
			appsDiv.appendChild(node)
			node.dataset.name = app
			node.querySelector('.name').textContent = app
			node.querySelector('.version').textContent = version
			const descriptionNode = node.querySelector('.description')
			descriptionNode.textContent = descriptionNode.title = description
			node.querySelector('.homepage').href = homepage
			node.querySelector('.manifest').href = prefix + app + '.json'

			for (const action of ['install', 'update', 'uninstall']) {
				const a = node.querySelector('.' + action)
				const command = a.querySelector('.command')
				command.textContent = `scoop ${action} ${app}`
				a.addEventListener('click', event => {
					command.focus()
					getSelection().selectAllChildren(command)
					document.execCommand('copy')
					event.preventDefault()
				})
			}
		}
	}

	const search = document.getElementById('search')
	let updateSearchTimeout = setTimeout(updateSearch, 0)

	function updateSearch() {
		const keyword = search.value
		for (const node of appsDiv.getElementsByClassName('app')) {
			node.hidden = !node.dataset.name.includes(keyword)
		}
	}

	search.addEventListener('input', () => {
		clearTimeout(updateSearchTimeout)
		updateSearchTimeout = setTimeout(updateSearch, 500)
	})

	search.addEventListener('keydown', event => {
		if (event.key === 'Escape') {
			search.value = ''
			updateSearch()
		} else if (event.key === 'Enter') {
			updateSearch()
		}
	})

	const settingsContainer = document.getElementById('settings-container')
	const settingsDiv = document.getElementById('settings')
	document.getElementById('open-settings').addEventListener('click', e => {
		e.preventDefault()
		settingsDiv.classList.toggle('open')
	})
	document.addEventListener('click', e => {
		if (!settingsContainer.contains(e.target) &&
			settingsDiv.classList.contains('open'))
			settingsDiv.classList.remove('open')
	})

	const settingsBuckets = document.getElementById('settings-buckets')
	const settingsBucketTemplate = document.getElementById('settings-bucket-template')
	const settingsReload = document.getElementById('settings-reload')
	settingsReload.addEventListener('click', e => {
		e.preventDefault()
		location.reload()
	})

	for (const bucket in data) {
		const frag = document.importNode(settingsBucketTemplate.content, true)
		const input = frag.querySelector('input')
		input.checked = !disabledBuckets[bucket]
		input.addEventListener('change', () => {
			if (input.checked)
				delete disabledBuckets[bucket]
			else
				disabledBuckets[bucket] = true
			putSettings('disabledBuckets', disabledBuckets)
			settingsReload.hidden = false
		})
		frag.querySelector('span').textContent = bucket
		settingsBuckets.appendChild(frag)
	}

}()