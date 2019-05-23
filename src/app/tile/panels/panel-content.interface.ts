/*
* This interface wraps the factory-created component in PanelComponent in
* order for it to have a data property. That way, we can pass in data into
* these factory-created components.
*/

export interface PanelContentComponent {
  data: any;
}
