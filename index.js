void async function () {
	const appsDiv = document.getElementById('apps')
	const appTemplate = document.getElementById('app-template')

	const data = await (await fetch('data.json')).json()
	for (const bucket in data) {
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
}()