import React, { useEffect, useRef, useState } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
// Import additional BPMN-JS modules
import minimapModule from "diagram-js-minimap";
import alignToOriginModule from "@bpmn-io/align-to-origin";
import gridModule from "diagram-js-grid";
import lintModule from "bpmn-js-bpmnlint";
import tokenSimulationModule from "bpmn-js-token-simulation";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "diagram-js-minimap/assets/diagram-js-minimap.css";
import "bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css";
import {CreateAppendAnythingModule} from 'bpmn-js-create-append-anything'
import './App.css'
// Custom User Task Provider
// First create a Base Provider that will handle the dragging functionality

class BaseCustomProvider {
  constructor(eventBus) {
    eventBus.on("drag.init", function (event) {
      event.stopPropagation();
    });
  }
}
BaseCustomProvider.$inject = ["eventBus"];
// Updated Custom User Task Provider
class CustomTaskProvider {
  constructor(
    palette,
    create,
    elementFactory,
    bpmnFactory,
    contextPad,
    modeling,
    connect
  ) {
    this.palette = palette;
    this.create = create;
    this.elementFactory = elementFactory;
    this.bpmnFactory = bpmnFactory;
    this.contextPad = contextPad;
    this.modeling = modeling;
    this.connect = connect;
    palette.registerProvider(this);
    contextPad.registerProvider(this);
  }
  getPaletteEntries(element) {
    return (entries) => {
      const keysToDelete = [
        "create.group",
        "create.task",
        "hand-tool",
        "create.data-object",
        "create.participant-expanded",
        "create.data-store",
        "lasso-tool",
        "space-tool",
        "global-connect-tool",
        "create.subprocess-expanded",
        "create.intermediate-event",
      ];
      // Iterate over the keys and delete them from entries
      keysToDelete.forEach((key) => {
        delete entries[key];
      });
      // Add your custom entries here
      entries["create.user-task"] = {
        group: "activity",
        className: "bpmn-icon-user-task",
        title: "Create User Task",
        action: {
          dragstart: (event) => this.createUserTask(event),
          click: (event) => this.createUserTask(event),
        },
      };
     
      entries["create.script-task"] = {
        group: "activity",
        className: "bpmn-icon-script-task",
        title: "Create Script Task",
        action: {
          dragstart: (event) => this.createScriptTask(event),
          click: (event) => this.createScriptTask(event),
        },
      };
      entries["create.exclusive-gateway"] = {
        group: "gateway",
        className: "bpmn-icon-gateway-xor",
        title: "Create Exclusive Gateway",
        action: {
          dragstart: (event) => this.createExclusiveGateway(event),
          click: (event) => this.createExclusiveGateway(event),
        },
      };
      entries["create.parallel-gateway"] = {
        group: "gateway",
        className: "bpmn-icon-gateway-parallel",
        title: "Create Parallel Gateway",
        action: {
          dragstart: (event) => this.createParallelGateway(event),
          click: (event) => this.createParallelGateway(event),
        },
      };
      entries["create.inclusive-gateway"] = {
        group: "gateway",
        className: "bpmn-icon-gateway-or",
        title: "Create Inclusive Gateway",
        action: {
          dragstart: (event) => this.createInclusiveGateway(event),
          click: (event) => this.createInclusiveGateway(event),
        },
      };
      entries["create.manual-task"] = {
        group: "activity",
        className: "bpmn-icon-manual-task",
        title: "Create Manual Task",
        action: {
          dragstart: (event) => this.createManualTask(event),
          click: (event) => this.createManualTask(event),
        },
      };
      entries["create.call-activity"] = {
        group: "activity",
        className: "bpmn-icon-call-activity",
        title: "Create Call Activity",
        action: {
          dragstart: (event) => this.createCallActivity(event),
          click: (event) => this.createCallActivity(event),
        },
      };
      entries["create.intermediate-signal"] = {
        group: "events",
        className: "bpmn-icon-intermediate-event-catch-signal",
        title: "Create Intermediate Signal Event",
        action: {
          dragstart: (event) => this.createIntermediateSignalCatchEvent(event),
          click: (event) => this.createIntermediateSignalCatchEvent(event),
        },
      };
      entries["create.intermediate-signal-throw"] = {
        group: "events",
        className: "bpmn-icon-intermediate-event-throw-signal",
        title: "Create Signal Throw Event",
        action: {
          dragstart: (event) => this.createIntermediateSignalThrow(event),
          click: (event) => this.createIntermediateSignalThrow(event),
        },
      };
      return entries;
    };
  }
  getContextPadEntries(element) {
    return (entries) => {
      const keysToDelete = [
        "append.gateway",
        "append.intermediate-event",
        "append.append-task",
        "append.text-annotation",
        // "replace"
      ];
      // Iterate over the keys and delete them from entries
      keysToDelete.forEach((key) => {
        delete entries[key];
      });
      entries["append.user-task"] = {
        group: "model",
        className: "bpmn-icon-user-task",
        title: "Append User Task",
        action: {
          click: (event, element) => {
            const shape = this.createShape("bpmn:UserTask", "User Task");
            const position = {
              x: element.x + element.width + 100,
              y: element.y,
            };
            this.appendShape(element, shape, position);
          },
        },
      };
      entries["append.call-activity"] = {
        group: "model",
        className: "bpmn-icon-call-activity",
        title: "Append Call Activity",
        action: {
          click: (event, element) => {
            const shape = this.createShape("bpmn:CallActivity", "Call Activity");
            const position = {
              x: element.x + element.width + 100,
              y: element.y,
            };
            this.appendShape(element, shape, position);
          },
        },
      };
      return entries;
      };
      
  }
  createShape(type, name) {
    const businessObject = this.bpmnFactory.create(type, {
      name: name,
    });
    return this.elementFactory.createShape({
      type: type,
      businessObject: businessObject,
      width: 70,
      height: 70,
    });
  }
  appendShape(source, shape, position) {
    this.modeling.appendShape(source, shape, position);
  }
  createUserTask(event) {
    const shape = this.createShape("bpmn:UserTask", "User Task");
    this.create.start(event, shape);
  }
  createServiceTask(event) {
    const shape = this.createShape("bpmn:ServiceTask", "Service Task");
    this.create.start(event, shape);
  }
  createScriptTask(event) {
    const shape = this.createShape("bpmn:ScriptTask", "Script Task");
    this.create.start(event, shape);
  }
  createExclusiveGateway(event) {
    const shape = this.createShape(
      "bpmn:ExclusiveGateway",
      "Exclusive Gateway"
    );
    this.create.start(event, shape);
  }
  createParallelGateway(event) {
    const shape = this.createShape("bpmn:ParallelGateway", "Parallel Gateway");
    this.create.start(event, shape);
  }
  createInclusiveGateway(event) {
    const shape = this.createShape(
      "bpmn:InclusiveGateway",
      "Inclusive Gateway"
    );
    this.create.start(event, shape);
  }
  createManualTask(event) {
    const shape = this.createShape("bpmn:ManualTask", "Manual Task");
    this.create.start(event, shape);
  }
  createCallActivity(event) {
    const shape = this.createShape("bpmn:CallActivity", "Call Activity");
    this.create.start(event, shape);
  }
  createIntermediateSignalCatchEvent(event) {
    const signalEventDefinition = this.bpmnFactory.create(
      "bpmn:SignalEventDefinition"
    );
    const businessObject = this.bpmnFactory.create(
      "bpmn:IntermediateCatchEvent",
      {
        name: "Signal Catch Event",
        eventDefinitions: [signalEventDefinition],
      }
    );
    const shape = this.elementFactory.createShape({
      type: "bpmn:IntermediateCatchEvent",
      businessObject: businessObject,
      width: 36,
      height: 36,
    });
    this.create.start(event, shape);
  }
  createIntermediateSignalThrow(event) {
    // Create the signal event definition
    const signalEventDefinition = this.bpmnFactory.create(
      "bpmn:SignalEventDefinition"
    );
    // Create the intermediate throw event with the signal definition
    const businessObject = this.bpmnFactory.create(
      "bpmn:IntermediateThrowEvent",
      {
        name: "Signal Throw Event",
        eventDefinitions: [signalEventDefinition],
      }
    );
    const shape = this.elementFactory.createShape({
      type: "bpmn:IntermediateThrowEvent",
      businessObject: businessObject,
      width: 36,
      height: 36,
    });
    this.create.start(event, shape);
  }
}

CustomTaskProvider.$inject = [
  "palette",
  "create",
  "elementFactory",
  "bpmnFactory",
  "contextPad",
  "modeling",
  "connect",
];
// Create a complete custom module
const customModule = {
  __init__: ["customTaskProvider", "baseCustomProvider"],
  baseCustomProvider: ["type", BaseCustomProvider],
  customTaskProvider: ["type", CustomTaskProvider],
};
const PropertiesPanel = ({ selectedElement, onPropertyChange, modeler }) => {
  const [localProperties, setLocalProperties] = useState({
    id: "",
    name: "",
    possibleOutcome: "",
    allocationType: "",
    role: "",
    escalationTime: "",
    allocationSMS: false,
    allocationEmail: false,
  });
  
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const suggestions = ["Role1", "Role2", "Role1.1", "Role1.2"];

  // Load properties from localStorage for the specific element when component mounts or element changes
  useEffect(() => {
    if (selectedElement) {
      const savedProperties = localStorage.getItem(`propertiesPanelState_${selectedElement.id}`);
      if (savedProperties) {
        const parsedProperties = JSON.parse(savedProperties);
        setLocalProperties(parsedProperties);
        setInputValue(parsedProperties.role || "");
        
        // Update the BPMN element with saved properties
        Object.entries(parsedProperties).forEach(([key, value]) => {
          onPropertyChange(key, value);
        });
      } else {
        // If no saved properties exist, initialize from the business object
        const businessObject = selectedElement.businessObject || {};
        const newProperties = {
          id: selectedElement.id || "",
          name: businessObject.name || "",
          allocationType: businessObject.allocationType || "",
          role: businessObject.role || "",
          escalationTime: businessObject.escalationTime || "",
          allocationSMS: businessObject.allocationSMS || false,
          allocationEmail: businessObject.allocationEmail || false,
          possibleOutcome: businessObject.possibleOutcome || "",
        };
        setLocalProperties(newProperties);
        setInputValue(businessObject.role || "");
      }
    }
  }, [selectedElement?.id]);

  // Save changes to localStorage and update BPMN
  const saveChanges = async () => {
    if (!modeler || !selectedElement) return;
    try {
      const { xml } = await modeler.saveXML({ format: true });
      localStorage.setItem("bpmnDiagram", xml);
      console.log("Diagram state saved automatically");
    } catch (error) {
      console.error("Error saving diagram state:", error);
    }
  };

  // Persist properties for the specific element
  const persistProperties = (properties) => {
    if (selectedElement) {
      localStorage.setItem(`propertiesPanelState_${selectedElement.id}`, JSON.stringify(properties));
    }
  };

  // Handle input changes
  const handleInputChange = (property, value) => {
    const updatedProperties = {
      ...localProperties,
      [property]: value
    };
    setLocalProperties(updatedProperties);
    persistProperties(updatedProperties);
    onPropertyChange(property, value);
  };

  // Handle role input and suggestions
  const handleRoleChange = (event) => {
    const value = event.target.value;
    setInputValue(value);
    handleInputChange("role", value);

    const filtered = suggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuggestions(filtered);
  };

  // Handle role selection from suggestions
  const handleRoleSelect = async (value) => {
    setInputValue(value);
    setFilteredSuggestions([]);
    handleInputChange("role", value);
    await saveChanges();
  };

  if (!selectedElement) {
    return (
      <div className="properties-placeholder">
        Select an element to edit properties
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <div className="property-group">
        <h3>General Properties</h3>
        <div className="property-row">
          <label>ID:</label>
          <input
            type="text"
            value={localProperties.id}
            onChange={(e) => handleInputChange("id", e.target.value)}
          />
        </div>
        
        {selectedElement.type !== "bpmn:SequenceFlow" && (
          <div className="property-row">
            <label>Name:</label>
            <input
              type="text"
              value={localProperties.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>
        )}

        {selectedElement.type === "bpmn:UserTask" && (
          <>
            <div className="property-row">
              <label>Allocation Type:</label>
              <select
                value={localProperties.allocationType}
                onChange={(e) => handleInputChange("allocationType", e.target.value)}
              >
                <option value="">Select type</option>
                <option value="individual">Individual</option>
                <option value="group">Group</option>
                <option value="role">Role</option>
              </select>
            </div>

            <div className="property-row">
              <label>Role:</label>
              <input
                className="autocomplete-input"
                type="text"
                value={inputValue}
                onChange={handleRoleChange}
                placeholder="Search for Role..."
              />
              {inputValue && filteredSuggestions.length > 0 && (
                <ul className="autocomplete-suggestions">
                  {filteredSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="autocomplete-suggestion"
                      onClick={() => handleRoleSelect(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="property-row">
              <label>Escalation Time:</label>
              <input
                type="number"
                value={localProperties.escalationTime}
                onChange={(e) => handleInputChange("escalationTime", e.target.value)}
                min="0"
                placeholder="Enter time in minutes"
              />
            </div>

            <div className="property-row checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={localProperties.allocationSMS}
                  onChange={(e) => handleInputChange("allocationSMS", e.target.checked)}
                />
                <span>Allocation SMS</span>
              </label>
            </div>

            <div className="property-row checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={localProperties.allocationEmail}
                  onChange={(e) => handleInputChange("allocationEmail", e.target.checked)}
                />
                <span>Allocation Email</span>
              </label>
            </div>
          </>
        )}

        {(selectedElement.type === "bpmn:ExclusiveGateway" || selectedElement.type === "bpmn:InclusiveGateway") && (
          <div className="property-row">
            <label>Possible Outcome:</label>
            <input
              type="text"
              value={localProperties.possibleOutcome}
              onChange={(e) => handleInputChange("possibleOutcome", e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};



// Main Modeller Component
const Modeller = () => {
  const [modeler, setModeler] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const containerRef = useRef(null);

  const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="sample-diagram"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;
  useEffect(() => {
    if (!containerRef.current) return;
    const bpmnModeler = new BpmnModeler({
      container: containerRef.current,
      additionalModules: [
        minimapModule,
        alignToOriginModule,
        gridModule,
        lintModule,
        tokenSimulationModule,
        customModule,
        // CreateAppendAnythingModule
      ],
      propertiesPanel: {
        parent: ".properties-container",
      },
      keyboard: {
        bindTo: document,
      },
      grid: {
        visible: true,
      },
      minimap: {
        open: true,
      },
      linting: {
        active: true,
      },
    });
    const setupModeler = async () => {
      try {
        const result = await bpmnModeler.importXML(initialDiagram);
        if (result.warnings.length) {
          console.warn(
            "Warnings while importing BPMN diagram:",
            result.warnings
          );
        }
        const canvas = bpmnModeler.get("canvas");
        if (!canvas) {
          throw new Error("Canvas not found");
        }
        canvas.zoom("fit-viewport");
        bpmnModeler.on("selection.changed", ({ newSelection }) => {
          setSelectedElement(newSelection[0] || null);
        });
        bpmnModeler.on("element.changed", (event) => {
          if (event.element === selectedElement) {
            setSelectedElement({ ...event.element });
          }
        });
        setModeler(bpmnModeler);
      } catch (error) {
        console.error("Error setting up BPMN modeler:", error);
      }
    };
    setupModeler();
    return () => {
      if (bpmnModeler) {
        bpmnModeler.destroy();
      }
    };
  }, []);
  const handlePropertyChange = (property, value) => {
    if (!modeler || !selectedElement) return;
    const modeling = modeler.get("modeling");
    try {
      if (property === "id") {
        modeling.updateProperties(selectedElement, { id: value });
      } else {
        modeling.updateProperties(selectedElement, { [property]: value });
      }
    } catch (error) {
      console.error("Error updating properties:", error);
    }
  };
  const handleSave = async () => {
    if (!modeler) return;
    try {
      const { xml } = await modeler.saveXML({ format: true });
      const blob = new Blob([xml], { type: "text/xml" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "diagram.bpmn";
      link.click();
      URL.revokeObjectURL(link.href);
      console.log("Diagram saved successfully.");
    } catch (error) {
      console.error("Error saving diagram:", error);
    }
  };
  return (
    <div className="app-container">
      <div className="toolbar">
        <div className="toolbar-group">
          <button onClick={handleSave}>Save Diagram</button>
        </div>
      </div>
      <div className="main-content">
        <div className="modeler-container" ref={containerRef}></div>
        <div className="properties-container">
          <PropertiesPanel
            selectedElement={selectedElement}
            onPropertyChange={handlePropertyChange}
          />
        </div>
      </div>
    </div>
  );
};
export default Modeller;
