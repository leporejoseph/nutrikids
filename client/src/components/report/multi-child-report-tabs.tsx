import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportView from "./report-view";
import { NutritionReport, MultiChildReport, ChildInfo } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface MultiChildReportTabsProps {
  multiChildReport: MultiChildReport;
  childInfo: ChildInfo;
}

export default function MultiChildReportTabs({ multiChildReport, childInfo }: MultiChildReportTabsProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  
  // Get all child reports from the multi-child report
  const childReports = multiChildReport.childReports;
  const childIds = Object.keys(childReports);
  
  // Set default active tab to the first child if not set
  if (!activeTab && childIds.length > 0) {
    setActiveTab(childIds[0]);
  }
  
  // If there are no reports, show a message
  if (childIds.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No reports available.</p>
      </div>
    );
  }
  
  return (
    <Tabs value={activeTab || childIds[0]} onValueChange={setActiveTab}>
      <TabsList className="mb-4 flex flex-wrap gap-1">
        {childIds.map(childId => {
          const report = childReports[childId];
          const child = childInfo.children.find(c => c.id === childId);
          const childName = child?.name || report.childName || `Child (${childId.substring(0, 4)})`;
          
          return (
            <TabsTrigger key={childId} value={childId} className="flex items-center gap-2">
              {childName}
              <Badge variant="secondary" className="ml-1 text-xs">
                {report.nutritionScore}%
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>
      
      {childIds.map(childId => (
        <TabsContent key={childId} value={childId}>
          <ReportView 
            report={childReports[childId]} 
            isLoading={false} 
            onBack={() => {}} // This is handled by the parent component
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}