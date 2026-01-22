'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  ArrowLeft, Plus, Save, X, Upload, Image as ImageIcon, Trash2, Edit,
  UtensilsCrossed, Cake, Music, Camera, Sparkles, Star, Package,
  ChefHat, Salad, Drumstick, Fish, Leaf, Coffee, Wine, IceCream
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  type: 'veg' | 'non-veg' | 'vegan'
  image?: string
  isPopular?: boolean
}

interface ServicePackage {
  id: string
  name: string
  description: string
  price: number
  priceUnit: string
  items: string[]
  image?: string
  isRecommended?: boolean
}

interface ServiceCategory {
  id: string
  name: string
  icon: string
  color: string
  menuItems: MenuItem[]
  packages: ServicePackage[]
}

const FOOD_CATEGORIES = [
  { name: 'Starters', icon: 'salad', color: 'bg-green-500' },
  { name: 'Main Course', icon: 'drumstick', color: 'bg-orange-500' },
  { name: 'Desserts', icon: 'cake', color: 'bg-pink-500' },
  { name: 'Beverages', icon: 'coffee', color: 'bg-amber-500' },
  { name: 'Live Counters', icon: 'chefhat', color: 'bg-red-500' },
]

const DECORATION_CATEGORIES = [
  { name: 'Stage Decoration', icon: 'sparkles', color: 'bg-purple-500' },
  { name: 'Table Setup', icon: 'package', color: 'bg-blue-500' },
  { name: 'Lighting', icon: 'star', color: 'bg-yellow-500' },
  { name: 'Floral', icon: 'leaf', color: 'bg-emerald-500' },
]

export default function VendorServicesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const vendorId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('Starters')
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddPackage, setShowAddPackage] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [packages, setPackages] = useState<ServicePackage[]>([])

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'Starters',
    type: 'veg',
    isPopular: false
  })

  const [newPackage, setNewPackage] = useState<Partial<ServicePackage>>({
    name: '',
    description: '',
    price: 0,
    priceUnit: 'per_person',
    items: [],
    isRecommended: false
  })

  useEffect(() => {
    fetchVendorData()
  }, [vendorId])

  const fetchVendorData = async () => {
    try {
      const res = await fetch(`/api/super-admin/service-management/vendors/${vendorId}`)
      if (res.ok) {
        const data = await res.json()
        setVendor(data.vendor)
        // Load existing menu items and packages from vendor data
        if (data.vendor?.services) {
          // Parse services into menu items
        }
      }
    } catch (error) {
      toast({ title: 'Failed to load vendor data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'item' | 'package') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'service')

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        const imageUrl = data.url || data.secure_url
        
        if (target === 'item') {
          setNewItem({ ...newItem, image: imageUrl })
        } else {
          setNewPackage({ ...newPackage, image: imageUrl })
        }
        toast({ title: 'Image uploaded!' })
      }
    } catch (error) {
      toast({ title: 'Failed to upload image', variant: 'destructive' })
    } finally {
      setUploadingImage(false)
    }
  }

  const addMenuItem = () => {
    if (!newItem.name) {
      toast({ title: 'Please enter item name', variant: 'destructive' })
      return
    }
    
    const item: MenuItem = {
      id: `item_${Date.now()}`,
      name: newItem.name!,
      description: newItem.description || '',
      price: newItem.price || 0,
      category: newItem.category || 'Starters',
      type: newItem.type || 'veg',
      image: newItem.image,
      isPopular: newItem.isPopular
    }
    
    setMenuItems([...menuItems, item])
    setNewItem({ name: '', description: '', price: 0, category: activeCategory, type: 'veg', isPopular: false })
    setShowAddItem(false)
    toast({ title: 'Menu item added!' })
  }

  const addPackage = () => {
    if (!newPackage.name) {
      toast({ title: 'Please enter package name', variant: 'destructive' })
      return
    }
    
    const pkg: ServicePackage = {
      id: `pkg_${Date.now()}`,
      name: newPackage.name!,
      description: newPackage.description || '',
      price: newPackage.price || 0,
      priceUnit: newPackage.priceUnit || 'per_person',
      items: newPackage.items || [],
      image: newPackage.image,
      isRecommended: newPackage.isRecommended
    }
    
    setPackages([...packages, pkg])
    setNewPackage({ name: '', description: '', price: 0, priceUnit: 'per_person', items: [], isRecommended: false })
    setShowAddPackage(false)
    toast({ title: 'Package added!' })
  }

  const removeMenuItem = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id))
  }

  const removePackage = (id: string) => {
    setPackages(packages.filter(pkg => pkg.id !== id))
  }

  const saveAllServices = async () => {
    try {
      const res = await fetch(`/api/super-admin/service-management/vendors/${vendorId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItems, packages })
      })

      if (res.ok) {
        toast({ title: 'Services saved successfully!' })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({ title: 'Failed to save services', variant: 'destructive' })
    }
  }

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'salad': return <Salad className="h-5 w-5" />
      case 'drumstick': return <Drumstick className="h-5 w-5" />
      case 'cake': return <Cake className="h-5 w-5" />
      case 'coffee': return <Coffee className="h-5 w-5" />
      case 'chefhat': return <ChefHat className="h-5 w-5" />
      case 'sparkles': return <Sparkles className="h-5 w-5" />
      case 'package': return <Package className="h-5 w-5" />
      case 'star': return <Star className="h-5 w-5" />
      case 'leaf': return <Leaf className="h-5 w-5" />
      default: return <UtensilsCrossed className="h-5 w-5" />
    }
  }

  const categories = vendor?.category?.toLowerCase().includes('catering') ? FOOD_CATEGORIES : DECORATION_CATEGORIES

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendor
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                {vendor?.company_name} - Service Menu
              </h1>
              <p className="text-gray-600 mt-1">Manage detailed menu items, packages, and pricing</p>
            </div>
            <Button onClick={saveAllServices} className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                activeCategory === cat.name
                  ? `${cat.color} text-white shadow-lg scale-105`
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {getCategoryIcon(cat.icon)}
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items Section */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5" />
                      {activeCategory} Menu
                    </CardTitle>
                    <CardDescription className="text-orange-100">
                      Add items with photos, descriptions, and pricing
                    </CardDescription>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => { setShowAddItem(true); setNewItem({ ...newItem, category: activeCategory }) }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Add Item Form */}
                {showAddItem && (
                  <div className="mb-6 p-4 bg-orange-50 rounded-xl border-2 border-orange-200 animate-in slide-in-from-top">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add New {activeCategory} Item
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Item Name *</label>
                        <Input
                          placeholder="e.g., Paneer Tikka, Chicken Biryani"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Price (₹)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newItem.price}
                          onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          placeholder="Describe the item, ingredients, serving size..."
                          value={newItem.description}
                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <div className="flex gap-2 mt-1">
                          {['veg', 'non-veg', 'vegan'].map((type) => (
                            <button
                              key={type}
                              onClick={() => setNewItem({ ...newItem, type: type as any })}
                              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                                newItem.type === type
                                  ? type === 'veg' ? 'bg-green-500 text-white' 
                                    : type === 'non-veg' ? 'bg-red-500 text-white'
                                    : 'bg-emerald-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${
                                type === 'veg' ? 'bg-green-600' : type === 'non-veg' ? 'bg-red-600' : 'bg-emerald-600'
                              }`} />
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Image</label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'item')}
                            className="hidden"
                            ref={fileInputRef}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                          </Button>
                          {newItem.image && (
                            <div className="w-10 h-10 rounded overflow-hidden">
                              <img src={newItem.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newItem.isPopular}
                          onChange={(e) => setNewItem({ ...newItem, isPopular: e.target.checked })}
                          className="rounded"
                        />
                        <label className="text-sm">Mark as Popular / Chef's Special</label>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={addMenuItem} className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddItem(false)}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Menu Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.filter(item => item.category === activeCategory).length === 0 ? (
                    <div className="md:col-span-2 text-center py-12 text-gray-500">
                      <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No items in {activeCategory} yet</p>
                      <Button variant="link" onClick={() => setShowAddItem(true)}>
                        Add your first item
                      </Button>
                    </div>
                  ) : (
                    menuItems.filter(item => item.category === activeCategory).map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-4 relative group"
                      >
                        {item.isPopular && (
                          <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500">
                            <Star className="h-3 w-3 mr-1 fill-white" />
                            Popular
                          </Badge>
                        )}
                        <div className="flex gap-4">
                          {item.image ? (
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold flex items-center gap-2">
                                  {item.name}
                                  <span className={`w-3 h-3 rounded-sm border-2 ${
                                    item.type === 'veg' ? 'border-green-600 bg-green-600' 
                                    : item.type === 'non-veg' ? 'border-red-600 bg-red-600'
                                    : 'border-emerald-600 bg-emerald-600'
                                  }`} />
                                </h4>
                                <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                              </div>
                              <p className="font-bold text-orange-600">₹{item.price}</p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeMenuItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Packages Section */}
          <div>
            <Card className="border-0 shadow-xl sticky top-4">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Packages
                    </CardTitle>
                    <CardDescription className="text-purple-100">
                      Bundled offerings
                    </CardDescription>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setShowAddPackage(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Add Package Form */}
                {showAddPackage && (
                  <div className="mb-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <h4 className="font-semibold mb-3">New Package</h4>
                    <div className="space-y-3">
                      <Input
                        placeholder="Package Name"
                        value={newPackage.name}
                        onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description"
                        value={newPackage.description}
                        onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Price"
                          value={newPackage.price}
                          onChange={(e) => setNewPackage({ ...newPackage, price: parseFloat(e.target.value) || 0 })}
                        />
                        <select
                          className="px-3 py-2 border rounded-lg"
                          value={newPackage.priceUnit}
                          onChange={(e) => setNewPackage({ ...newPackage, priceUnit: e.target.value })}
                        >
                          <option value="per_person">Per Person</option>
                          <option value="per_event">Per Event</option>
                          <option value="per_plate">Per Plate</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newPackage.isRecommended}
                          onChange={(e) => setNewPackage({ ...newPackage, isRecommended: e.target.checked })}
                        />
                        <label className="text-sm">Recommended</label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addPackage} className="bg-purple-500">Add</Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddPackage(false)}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Packages List */}
                <div className="space-y-3">
                  {packages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No packages yet</p>
                    </div>
                  ) : (
                    packages.map((pkg) => (
                      <div 
                        key={pkg.id} 
                        className={`p-4 rounded-xl border-2 relative ${
                          pkg.isRecommended 
                            ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {pkg.isRecommended && (
                          <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-purple-500 to-pink-500">
                            Recommended
                          </Badge>
                        )}
                        <h4 className="font-semibold">{pkg.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-lg font-bold text-purple-600">
                            ₹{pkg.price}
                            <span className="text-sm font-normal text-gray-500">
                              /{pkg.priceUnit.replace('_', ' ')}
                            </span>
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => removePackage(pkg.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
