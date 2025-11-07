import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { 
	Tldraw, 
	DefaultMainMenu,
	DefaultMainMenuContent,
	TldrawUiMenuGroup,
	TldrawUiMenuItem,
	type TLComponents
} from 'tldraw'
import 'tldraw/tldraw.css'



function CustomMainMenu() {
	const navigate = useNavigate()
	
	return (
		<DefaultMainMenu>
			<TldrawUiMenuGroup id="navigation">
				<TldrawUiMenuItem
					id="back-to-home"
					label="Back to home"
					icon="home"
					readonlyOk
					onSelect={() => {
						navigate({ to: '/' })
					}}
				/>
			</TldrawUiMenuGroup>
			<TldrawUiMenuGroup id="developer">
				<TldrawUiMenuItem
					id="clear-local-storage"
					label="Clear local storage"
					icon="trash"
					readonlyOk
					onSelect={() => {
						localStorage.clear()
						window.location.reload()
					}}
				/>
			</TldrawUiMenuGroup>
			<DefaultMainMenuContent />
		</DefaultMainMenu>
	)
}

const components: TLComponents = {
	MainMenu: CustomMainMenu,
	StylePanel: null,
	PageMenu: null,
	ActionsMenu: null,
	HelperButtons: null,
	QuickActions: null,
}

export default function App() {
	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<Tldraw persistenceKey="sidr-lite-canvas" components={components}>

			</Tldraw>
		</div>
	)
}

export const Route = createFileRoute('/canvas')({
  component: App,
})
