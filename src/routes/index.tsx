import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export default function App() {
	const navigate = useNavigate()

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100vh',
				width: '100vw',
			}}
		>
			<Button
				className="px-8 py-4 text-xl rounded-md"
				onClick={() => navigate({ to: '/canvas' })}
			>
			 Open Canvas
			</Button>
		</div>
	)
}

export const Route = createFileRoute('/')({
  component: App,
})
