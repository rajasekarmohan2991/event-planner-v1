"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Globe, Info, CheckCircle, Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TaxStructure {
  id: string;
  name: string;
  rate: number;
  description?: string;
  countryCode?: string;
  currencyCode?: string;
  taxType?: string;
  isDefault: boolean;
  isCustom?: boolean;
  isEditable?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

interface GlobalTemplate {
  id: string;
  name: string;
  rate: number;
  description?: string;
  taxType?: string;
  countryCode?: string;
}

export default function CompanyTaxSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [taxStructures, setTaxStructures] = useState<TaxStructure[]>([]);
  const [globalTemplates, setGlobalTemplates] = useState<GlobalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [financeMode, setFinanceMode] = useState<string>('legacy');
  const [editable, setEditable] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxStructure | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rate: 0,
    description: '',
    taxType: 'CUSTOM',
    isDefault: false
  });

  const tenantId = (session?.user as any)?.tenantId || (session?.user as any)?.currentTenantId;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/signin");
      return;
    }
    fetchTaxStructures();
  }, [session, status, router]);

  async function fetchTaxStructures() {
    try {
      if (!tenantId) {
        console.error("No tenant ID found");
        setLoading(false);
        return;
      }

      // Fetch company info to get country
      const companyRes = await fetch(`/api/super-admin/companies/${tenantId}`);
      if (companyRes.ok) {
        const company = await companyRes.json();
        setCompanyInfo(company);
      }

      // Fetch tax structures using the new tenant taxes API
      const res = await fetch(`/api/tenants/${tenantId}/taxes`);
      if (res.ok) {
        const data = await res.json();
        setTaxStructures(data.taxes || []);
        setGlobalTemplates(data.globalTemplates || []);
        setFinanceMode(data.mode || 'legacy');
        setEditable(data.editable || false);
      } else {
        // Fallback to old API
        const fallbackRes = await fetch(`/api/super-admin/companies/${tenantId}/tax-structures`);
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setTaxStructures(data.taxStructures || []);
        }
      }
    } catch (error) {
      console.error("Error fetching tax structures:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingTax(null);
    setFormData({ name: '', rate: 0, description: '', taxType: 'CUSTOM', isDefault: false });
    setShowModal(true);
  }

  function openEditModal(tax: TaxStructure) {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      rate: tax.rate,
      description: tax.description || '',
      taxType: tax.taxType || 'CUSTOM',
      isDefault: tax.isDefault
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!formData.name || formData.rate === undefined) {
      toast({ title: 'Error', description: 'Name and rate are required', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);

      if (editingTax) {
        // Update existing
        const res = await fetch(`/api/tenants/${tenantId}/taxes/${editingTax.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          toast({ title: 'Success', description: 'Tax updated successfully' });
        } else {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update tax');
        }
      } else {
        // Create new
        const res = await fetch(`/api/tenants/${tenantId}/taxes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          toast({ title: 'Success', description: 'Tax created successfully' });
        } else {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create tax');
        }
      }

      setShowModal(false);
      await fetchTaxStructures();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(taxId: string) {
    if (!confirm('Are you sure you want to delete this tax structure?')) return;

    try {
      const res = await fetch(`/api/tenants/${tenantId}/taxes/${taxId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: 'Success', description: data.message });
        await fetchTaxStructures();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete tax');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  async function adoptTemplate(template: GlobalTemplate) {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/taxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          rate: template.rate,
          description: template.description,
          taxType: template.taxType,
          globalTemplateId: template.id
        })
      });

      if (res.ok) {
        toast({ title: 'Success', description: `Adopted "${template.name}" template` });
        await fetchTaxStructures();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to adopt template');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Globe className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tax Settings</h1>
              <p className="text-gray-600">
                {editable ? 'Manage your tax structures' : 'View applicable tax structures for your company'}
              </p>
            </div>
          </div>
          {editable && (
            <Button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Tax
            </Button>
          )}
        </div>

        {/* Info Banner */}
        {!editable && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Read-Only View</p>
              <p>These tax structures are configured based on your company's registration country ({companyInfo?.country || 'Not set'}). 
              To manage your own taxes, enable Advanced Finance mode in Finance Settings.</p>
            </div>
          </div>
        )}

        {editable && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-medium mb-1">Advanced Finance Mode</p>
              <p>You have full control over tax configuration. Create, edit, or delete tax structures as needed.</p>
            </div>
          </div>
        )}
      </div>

      {/* Company Info */}
      {companyInfo && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Company Name</p>
              <p className="font-medium text-gray-900">{companyInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registration Country</p>
              <p className="font-medium text-gray-900">{companyInfo.country || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Finance Mode</p>
              <p className="font-medium text-gray-900">{financeMode === 'tenant' ? 'Advanced' : 'Legacy'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Global Templates (for Advanced mode) */}
      {editable && globalTemplates.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Available Global Templates</h2>
            <p className="text-sm text-gray-500">Adopt a template to quickly add a tax structure</p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {globalTemplates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 hover:border-indigo-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <span className="text-lg font-bold text-indigo-600">{template.rate}%</span>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => adoptTemplate(template)}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adopt Template
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Structures */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            {editable ? 'Your Tax Structures' : 'Applicable Tax Structures'}
          </h2>
        </div>

        {taxStructures.length === 0 ? (
          <div className="p-8 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No tax structures configured</p>
            <p className="text-sm text-gray-500">
              {editable 
                ? 'Click "Add Tax" to create your first tax structure.' 
                : 'Contact your administrator to set up tax structures for your company.'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {taxStructures.map((tax) => (
              <div key={tax.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{tax.name}</h3>
                      {tax.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          <CheckCircle className="h-3 w-3" />
                          Default
                        </span>
                      )}
                      {tax.isCustom && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                          Custom
                        </span>
                      )}
                    </div>
                    {tax.description && (
                      <p className="text-gray-600 mb-3">{tax.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Tax Rate</p>
                        <p className="font-medium text-gray-900">{tax.rate}%</p>
                      </div>
                      {tax.taxType && (
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-medium text-gray-900">{tax.taxType}</p>
                        </div>
                      )}
                      {tax.countryCode && (
                        <div>
                          <p className="text-sm text-gray-600">Country</p>
                          <p className="font-medium text-gray-900">{tax.countryCode}</p>
                        </div>
                      )}
                      {tax.effectiveFrom && (
                        <div>
                          <p className="text-sm text-gray-600">Effective From</p>
                          <p className="font-medium text-gray-900">
                            {new Date(tax.effectiveFrom).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {editable && (
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(tax)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(tax.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTax ? 'Edit Tax Structure' : 'Create Tax Structure'}</DialogTitle>
            <DialogDescription>
              {editingTax ? 'Update the tax structure details.' : 'Add a new custom tax structure.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., GST 18%"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate">Rate (%) *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 18"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxType">Tax Type</Label>
              <select
                id="taxType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.taxType}
                onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
              >
                <option value="CUSTOM">Custom</option>
                <option value="GST">GST</option>
                <option value="VAT">VAT</option>
                <option value="SALES_TAX">Sales Tax</option>
                <option value="SERVICE_TAX">Service Tax</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isDefault" className="text-sm font-normal">Set as default tax</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingTax ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
