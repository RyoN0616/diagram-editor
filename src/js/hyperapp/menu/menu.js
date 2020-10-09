import { h } from "hyperapp"

import promptSaveAs from "../../prompt-save-as.js"
import showDialogAsync from "../../show-dialog-async.js"

const Menu = () => (state, actions) => (
  <div class="menubar pure-menu pure-menu-horizontal">
    {renderIf(
      state.menuPath.length > 0,
      <div
        style="position: fixed; top: 0; bottom: 0; left: 0; right: 0;"
        onclick={e => {
          e.stopPropagation()
          e.preventDefault()

          actions.closeMenu()
        }}
      />
    )}
    <ul class="menubar__list pure-menu-list">
      <SubMenu
        name="File"
        displayName="ファイル"
        depth={0}
        path={state.menuPath}
        setPath={menuPath => actions.setMenuPath({ menuPath })}
      >
        <MenuItem
          menuAction={async () => {
            actions.saveData({ saveData: await state.db.getAll("saveData") })

            const { title } = await showDialogAsync("load-dialog")

            const { data } = await state.db.get("saveData", title)

            if (data) {
              actions.load({ data })
            }

            actions.closeMenu()
          }}
        >
          開く
        </MenuItem>
        <MenuItem
          menuAction={async () => {
            const { file } = await showDialogAsync("import-dialog")

            actions.closeMenu()

            const reader = new FileReader()
            reader.onload = ({ target }) =>
              actions.import({ json: target.result })
            reader.readAsText(file)
          }}
        >
          インポート
        </MenuItem>
        <hr />
        <MenuItem
          menuAction={async () => {
            await actions.save({
              data: document.getElementById("graph-editor").toPlainObj(),
            })
            actions.closeMenu()
          }}
        >
          保存
        </MenuItem>
        <MenuItem
          menuAction={async () => {
            const title = await promptSaveAs()

            actions.setTitle({ title })
            actions.save({
              data: document.getElementById("graph-editor").toPlainObj(),
            })
            actions.closeMenu()
          }}
        >
          名前を付けて保存
        </MenuItem>
        <MenuItem
          menuAction={async () => {
            const { filename } = await showDialogAsync("export-dialog")

            actions.closeMenu()
            actions.export({ name: filename })
          }}
        >
          エクスポート
        </MenuItem>
      </SubMenu>
      <SubMenu
        name="Edit"
        displayName="編集"
        depth={0}
        path={state.menuPath}
        setPath={menuPath => actions.setMenuPath({ menuPath })}
      >
        <MenuItem
          menuAction={async () => {
            actions.undo()
            actions.closeMenu()
          }}
        >
          元に戻す
        </MenuItem>
        <MenuItem
          menuAction={async () => {
            actions.redo()
            actions.closeMenu()
          }}
        >
          やりなおし
        </MenuItem>
      </SubMenu>
    </ul>
  </div>
)

const SubMenu = (
  { name, displayName, depth, klass, path, setPath },
  children
) => (
  <li
    class={classcat(
      "pure-menu-item",
      "pure-menu-has-children",
      { "pure-menu-active": path[depth] === name },
      klass
    )}
  >
    <span
      class="menubar__item pure-menu-link"
      onclick={e => {
        e.stopPropagation()
        e.preventDefault()

        if (path[depth] === name) {
          const menuPath = path.slice(0, depth)
          setPath(menuPath)
          return
        }

        const menuPath = path.slice(0, depth).concat(name)
        setPath(menuPath)
      }}
    >
      {displayName || name}
    </span>
    <ul class="menubar__submenu pure-menu-children">{children}</ul>
  </li>
)

const MenuItem = ({ menuAction, klass }, children) => (
  <li class={classcat("pure-menu-item", klass)}>
    <span
      class="menubar__item pure-menu-link"
      onclick={async e => {
        e.preventDefault()
        e.stopPropagation()

        try {
          await menuAction(e)
        } catch (error) {
          if (error.name == "DialogCancelError") {
            return
          }

          throw error
        }
      }}
    >
      {children}
    </span>
  </li>
)

function classcat(...a) {
  return flatAll(...a).join(" ")
}

function flatAll(...a) {
  return a.flatMap(x => {
    if (typeof x == "string") {
      return x
    }

    if (Array.isArray(x)) {
      return flatAll(...x)
    }

    if (typeof x == "object") {
      return Array.from(Object.entries(x))
        .filter(([_k, v]) => v)
        .map(([k]) => k)
    }

    return []
  })
}

function renderIf(cond, view, otherwise) {
  if (cond) {
    return view
  } else {
    return otherwise
  }
}

export default Menu
