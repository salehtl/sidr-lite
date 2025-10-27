import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '../components/ui/sidebar'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Plus, Circle, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useFlow } from '../contexts/FlowContext'

export function AppSidebar() {
  const { selectedNode, createNode } = useFlow();
  const [nodeLabel, setNodeLabel] = useState(selectedNode?.data.label || '');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'male' | 'female'>('male');

  // Update local state when selectedNode changes
  useEffect(() => {
    setNodeLabel(selectedNode?.data.label || '');
  }, [selectedNode]);

  const handleLabelChange = (newLabel: string) => {
    setNodeLabel(newLabel);
    // For now, just update local state. The actual update will be handled by the main component
    console.log('Label changed to:', newLabel);
  };

  const handleCreatePerson = () => {
    if (formName.trim()) {
      createNode(formName.trim(), formGender);
      setFormName(''); // Reset form
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">S</span>
          </div>
          <span className="text-lg font-semibold">Sidr Lite</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        {selectedNode ? (
          // Node selected state - show editable metadata
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Circle className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Node Properties</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Node ID
                </label>
                <Input 
                  value={selectedNode.id} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Label
                </label>
                <Input 
                  value={nodeLabel}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="Enter node label..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Position
                </label>
                <div className="flex gap-2">
                  <Input 
                    value={Math.round(selectedNode.position.x)} 
                    disabled 
                    className="bg-muted"
                    placeholder="X"
                  />
                  <Input 
                    value={Math.round(selectedNode.position.y)} 
                    disabled 
                    className="bg-muted"
                    placeholder="Y"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Empty state - show person creation form
          <div className="p-4 space-y-4">
            <div className="text-center py-4">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Create New Person</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Add a new person to the family tree using the form below.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Name
                </label>
                <Input 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter person's name..."
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Gender
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={formGender === 'male' ? 'default' : 'outline'}
                    onClick={() => setFormGender('male')}
                    className="flex-1"
                  >
                    Male
                  </Button>
                  <Button
                    variant={formGender === 'female' ? 'default' : 'outline'}
                    onClick={() => setFormGender('female')}
                    className="flex-1"
                  >
                    Female
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleCreatePerson} 
                className="w-full"
                disabled={!formName.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Person
              </Button>
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-sm text-muted-foreground">
          Sidr Lite v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
