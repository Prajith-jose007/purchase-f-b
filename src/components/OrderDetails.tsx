
"use client";

import type { Order, Branch, User, OrderStatus, UploadedInvoice, OrderItem } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, CalendarDays, UserCircle, MapPin, Edit, CheckCircle, AlertCircle, UploadCloud, FileText, Trash2, Save } from 'lucide-react';
import FileUpload from './FileUpload';
import { useState } from 'react';
import { ScrollArea } from './ui/scroll-area';

interface OrderDetailsProps {
  order: Order;
  editableOrderItems?: OrderItem[]; 
  branch?: Branch;
  user?: User;
  allowStatusUpdate?: boolean;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => Promise<void>;
  isEditingStatus?: boolean;
  setIsEditingStatus?: (isEditing: boolean) => void;
  allowInvoiceManagement?: boolean;
  onAddInvoice?: (orderId: string, fileName: string, dataUrl: string) => Promise<void>;
  onRemoveInvoice?: (invoiceId: number, invoiceFileName: string) => Promise<void>;
  allowItemEditing?: boolean; 
  onItemQuantityChange?: (itemCode: string, newQuantity: number) => void;
  onSaveItemChanges?: (orderId: string) => Promise<void>; 
}

const overallStatusColors: Record<OrderStatus, string> = {
  Pending: "bg-yellow-500 hover:bg-yellow-600",
  Approved: "bg-blue-500 hover:bg-blue-600",
  Processing: "bg-purple-500 hover:bg-purple-600",
  Shipped: "bg-teal-500 hover:bg-teal-600",
  Delivered: "bg-green-500 hover:bg-green-600",
  Cancelled: "bg-red-500 hover:bg-red-600",
};
const orderOverallStatuses: OrderStatus[] = ["Pending", "Approved", "Processing", "Shipped", "Delivered", "Cancelled"];


export default function OrderDetails({ 
  order, 
  editableOrderItems,
  branch, 
  user, 
  allowStatusUpdate = false, 
  onUpdateStatus,
  isEditingStatus,
  setIsEditingStatus,
  allowInvoiceManagement = false,
  onAddInvoice,
  onRemoveInvoice,
  allowItemEditing = false,
  onItemQuantityChange,
  onSaveItemChanges,
}: OrderDetailsProps) {

  const [showInvoiceUploader, setShowInvoiceUploader] = useState(false);
  
  const itemsToDisplay = allowItemEditing && editableOrderItems ? editableOrderItems : order.items;

  const hasItemChanges = allowItemEditing && editableOrderItems && 
    JSON.stringify(
      order.items.map(oi => ({ 
        itemCode: oi.item.code, 
        quantity: oi.quantity, 
      })).sort((a, b) => a.itemCode.localeCompare(b.itemCode))
    ) !== JSON.stringify(
      editableOrderItems.map(oi => ({ 
        itemCode: oi.item.code, 
        quantity: oi.quantity, 
      })).sort((a, b) => a.itemCode.localeCompare(b.itemCode))
    );


  const handleOverallStatusChange = async (newStatus: OrderStatus) => {
    if (onUpdateStatus && setIsEditingStatus) {
      await onUpdateStatus(order.id, newStatus);
      setIsEditingStatus(false);
    }
  };

  const handleInvoiceUploaded = async (fileContent: string, fileName: string) => {
    if (onAddInvoice) {
      await onAddInvoice(order.id, fileName, fileContent); 
    }
    setShowInvoiceUploader(false); 
  };
  
  return (
    <Card className="shadow-xl w-full">
      <CardHeader className="bg-muted/30 p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle className="font-headline text-3xl md:text-4xl text-primary">Order #{order.id.slice(-6)}</CardTitle>
            <CardDescription className="text-md text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </CardDescription>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            {isEditingStatus && allowStatusUpdate && setIsEditingStatus ? (
              <div className="flex items-center gap-2">
                <Select defaultValue={order.status} onValueChange={(val) => handleOverallStatusChange(val as OrderStatus)}>
                  <SelectTrigger className="w-[180px] h-10 bg-background">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderOverallStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingStatus(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge className={`px-4 py-2 text-sm font-semibold text-white ${overallStatusColors[order.status]}`}>
                  {order.status === 'Shipped' && <Truck className="inline-block h-4 w-4 mr-1.5" />}
                  {order.status === 'Delivered' && <CheckCircle className="inline-block h-4 w-4 mr-1.5" />}
                  {order.status === 'Cancelled' && <AlertCircle className="inline-block h-4 w-4 mr-1.5" />}
                  {order.status}
                </Badge>
                {allowStatusUpdate && setIsEditingStatus && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingStatus(true)}>
                    <Edit className="h-3 w-3 mr-1.5" /> Change Status
                  </Button>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Last updated: {new Date(order.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {user && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><UserCircle />Requested By</h3>
              <p className="text-lg font-semibold">{user.name || order.userName}</p>
              <p className="text-sm text-muted-foreground">Role: {user.role.replace('_', ' ')}</p>
            </div>
          )}
          {branch && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><MapPin />Branch</h3>
              <p className="text-lg font-semibold">{branch.name || order.branchName}</p>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline text-2xl">Order Items</h3>
            {allowItemEditing && onSaveItemChanges && hasItemChanges && (
              <Button size="sm" onClick={() => onSaveItemChanges(order.id)}>
                <Save className="mr-2 h-4 w-4" /> Save Item Changes
              </Button>
            )}
          </div>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Description</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsToDisplay.map(({ item, quantity }) => (
                  <TableRow key={item.code}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-muted-foreground">{item.code}</TableCell>
                    <TableCell>{item.units}</TableCell>
                    <TableCell className="text-center">
                      {allowItemEditing && onItemQuantityChange ? (
                        <Input 
                          type="number"
                          value={quantity}
                          onChange={(e) => onItemQuantityChange(item.code, parseInt(e.target.value, 10))}
                          className="w-20 h-8 text-center mx-auto"
                          min="0"
                        />
                      ) : (
                        quantity
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {allowInvoiceManagement && (
          <>
            <Separator />
            <div>
              <h3 className="font-headline text-2xl mb-4">Invoice Management</h3>
              {(order.invoices && order.invoices.length > 0) ? (
                <ScrollArea className="max-h-60 mb-4 pr-2">
                  <div className="space-y-3">
                    {order.invoices.map((invoice) => (
                      <div key={invoice.id || invoice.fileName} className="flex items-center justify-between gap-2 p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="h-6 w-6 text-primary" />
                          <div>
                            <p className="font-medium">{invoice.fileName}</p>
                            <p className="text-xs text-muted-foreground">Uploaded: {new Date(invoice.uploadedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {onRemoveInvoice && invoice.id && ( 
                          <Button variant="ghost" size="icon" onClick={() => onRemoveInvoice(invoice.id!, invoice.fileName)} aria-label={`Remove ${invoice.fileName}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground mb-4">No invoices uploaded for this order.</p>
              )}
              
              {onAddInvoice && (
                <Button variant="outline" onClick={() => setShowInvoiceUploader(prev => !prev)} className="w-full md:w-auto">
                  <UploadCloud className="mr-2 h-4 w-4" /> {showInvoiceUploader ? "Cancel Upload" : (order.invoices && order.invoices.length > 0 ? "Add Another Invoice" : "Upload Invoice")}
                </Button>
              )}

              {showInvoiceUploader && onAddInvoice && (
                 <div className="mt-4">
                  <FileUpload 
                    onFileUpload={handleInvoiceUploaded}
                    acceptedFileType=".pdf,.jpg,.jpeg,.png"
                    labelText={"Choose invoice file (PDF, JPG, PNG)"}
                    buttonText={"Upload Selected Invoice"}
                  />
                 </div>
              )}
            </div>
          </>
        )}

      </CardContent>
      <CardFooter className="bg-muted/30 p-6 text-right">
        <p className="text-lg font-semibold">
          Total Item Units Requested: {order.items.reduce((sum, current) => sum + current.quantity, 0)}
        </p>
      </CardFooter>
    </Card>
  );
}
