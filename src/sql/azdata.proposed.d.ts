/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// This is the place for API experiments and proposal.

import * as vscode from 'vscode';

declare module 'azdata' {
	/**
	 * Namespace for connection management
	 */
	export namespace connection {
		export type ConnectionEventType =
			| 'onConnect'
			| 'onDisconnect'
			| 'onConnectionChanged';

		export interface ConnectionEventListener {
			onConnectionEvent(type: ConnectionEventType, ownerUri: string, args: IConnectionProfile): void;
		}

		/**
		 * Register a connection event listener
		 */
		export function registerConnectionEventListener(listener: connection.ConnectionEventListener): void;

		export function getConnection(uri: string): Thenable<ConnectionProfile>;
	}

	export namespace nb {
		export interface NotebookDocument {
			/**
			 * Sets the trust mode for the notebook document.
			 */
			setTrusted(state: boolean);
		}
	}

	export type SqlDbType = 'BigInt' | 'Binary' | 'Bit' | 'Char' | 'DateTime' | 'Decimal'
		| 'Float' | 'Image' | 'Int' | 'Money' | 'NChar' | 'NText' | 'NVarChar' | 'Real'
		| 'UniqueIdentifier' | 'SmallDateTime' | 'SmallInt' | 'SmallMoney' | 'Text' | 'Timestamp'
		| 'TinyInt' | 'VarBinary' | 'VarChar' | 'Variant' | 'Xml' | 'Udt' | 'Structured' | 'Date'
		| 'Time' | 'DateTime2' | 'DateTimeOffset';

	export interface SimpleColumnInfo {
		name: string;
		/**
		 * This is expected to match the SqlDbTypes for serialization purposes
		 */
		dataTypeName: SqlDbType;
	}
	export interface SerializeDataStartRequestParams {
		/**
		 * 'csv', 'json', 'excel', 'xml'
		 */
		saveFormat: string;
		filePath: string;
		isLastBatch: boolean;
		rows: DbCellValue[][];
		columns: SimpleColumnInfo[];
		includeHeaders?: boolean;
		delimiter?: string;
		lineSeperator?: string;
		textIdentifier?: string;
		encoding?: string;
		formatted?: boolean;
	}

	export interface SerializeDataContinueRequestParams {
		filePath: string;
		isLastBatch: boolean;
		rows: DbCellValue[][];
	}

	export interface SerializeDataResult {
		messages?: string;
		succeeded: boolean;
	}

	export interface SerializationProvider extends DataProvider {
		startSerialization(requestParams: SerializeDataStartRequestParams): Thenable<SerializeDataResult>;
		continueSerialization(requestParams: SerializeDataContinueRequestParams): Thenable<SerializeDataResult>;
	}

	export namespace dataprotocol {
		export function registerSerializationProvider(provider: SerializationProvider): vscode.Disposable;
	}

	export interface HyperlinkComponent {
		/**
		 * An event called when the text is clicked
		 */
		onDidClick: vscode.Event<any>;
	}

	export interface DeclarativeTableColumn {
		headerCssStyles?: { [key: string]: string };
		rowCssStyles?: { [key: string]: string };
		ariaLabel?: string;
	}

	export enum DeclarativeDataType {
		component = 'component'
	}

	/*
	 * Add optional azureAccount for connectionWidget.
	 */
	export interface IConnectionProfile extends ConnectionInfo {
		azureAccount?: string;
	}

	/*
	 * Add optional per-OS default value.
	 */
	export interface DefaultValueOsOverride {
		os: string;

		defaultValueOverride: string;
	}

	export interface ConnectionOption {
		defaultValueOsOverrides?: DefaultValueOsOverride[];
	}

	export interface ModelBuilder {
		radioCardGroup(): ComponentBuilder<RadioCardGroupComponent>;
		tabbedPanel(): TabbedPanelComponentBuilder;
		separator(): ComponentBuilder<SeparatorComponent>;
		propertiesContainer(): ComponentBuilder<PropertiesContainerComponent>;
	}

	export interface RadioCard {
		id: string;
		label: string;
		descriptions?: RadioCardDescription[];
		icon?: string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri };
	}

	export interface RadioCardDescription {
		ariaLabel: string;
		labelHeader: string;
		contents: RadioCardLabelValuePair[];
		valueHeader?: string;
	}

	export interface RadioCardLabelValuePair {
		label: string;
		value?: string;
	}

	export interface RadioCardGroupComponentProperties extends ComponentProperties, TitledComponentProperties {
		cards: RadioCard[];
		cardWidth: string;
		cardHeight: string;
		iconWidth?: string;
		iconHeight?: string;
		selectedCardId?: string;
	}

	export interface RadioCardGroupComponent extends Component, RadioCardGroupComponentProperties {
		onSelectionChanged: vscode.Event<any>;
	}

	export interface SeparatorComponent extends Component {
	}

	export interface DeclarativeTableProperties extends ComponentProperties {
	}

	export interface ComponentProperties {
		ariaHidden?: boolean;
	}

	export interface ComponentWithIconProperties {
		/**
		 * The path for the icon with optional dark-theme away alternative
		 */
		iconPath?: string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri };
		/**
		 * The height of the icon
		 */
		iconHeight?: number | string;
		/**
		 * The width of the icon
		 */
		iconWidth?: number | string;
		/**
		 * The title for the icon. This title will show when hovered over
		 */
		title?: string;
	}

	export interface ComponentWithIcon extends ComponentWithIconProperties {
	}

	export interface ImageComponent extends ComponentWithIcon {
	}

	export interface ImageComponentProperties extends ComponentProperties, ComponentWithIconProperties {
	}

	/**
	 * Panel component with tabs
	 */
	export interface TabbedPanelComponent extends Container<TabbedPanelLayout, any> {
		/**
		 * An event triggered when the selected tab is changed.
		 * The event argument is the id of the selected tab.
		 */
		onTabChanged: vscode.Event<string>;

		/**
		 * update the tabs.
		 * @param tabs new tabs
		 */
		updateTabs(tabs: (Tab | TabGroup)[]): void;
	}

	/**
	 * Defines the tab orientation of TabbedPanelComponent
	 */
	export enum TabOrientation {
		Vertical = 'vertical',
		Horizontal = 'horizontal'
	}

	/**
	 * Layout of TabbedPanelComponent, can be used to initialize the component when using ModelBuilder
	 */
	export interface TabbedPanelLayout {
		/**
		 * Tab orientation. Default horizontal.
		 */
		orientation?: TabOrientation;

		/**
		 * Whether to show the tab icon. Default false.
		 */
		showIcon?: boolean;

		/**
		 * Whether to show the tab navigation pane even when there is only one tab. Default false.
		 */
		alwaysShowTabs?: boolean;
	}

	/**
	 * Represents the tab of TabbedPanelComponent
	 */
	export interface Tab {
		/**
		 * Title of the tab
		 */
		title: string;

		/**
		 * Content component of the tab
		 */
		content: Component;

		/**
		 * Id of the tab
		 */
		id: string;

		/**
		 * Icon of the tab
		 */
		icon?: string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri };
	}

	/**
	 * Represents the tab group of TabbedPanelComponent
	 */
	export interface TabGroup {
		/**
		 * Title of the tab group
		 */
		title: string;

		/**
		 * children of the tab group
		 */
		tabs: Tab[];
	}

	/**
	 * Builder for TabbedPannelComponent
	 */
	export interface TabbedPanelComponentBuilder extends ContainerBuilder<TabbedPanelComponent, TabbedPanelLayout, any> {
		/**
		 * Add the tabs to the component
		 * @param tabs tabs/tab groups to be added
		 */
		withTabs(tabs: (Tab | TabGroup)[]): ContainerBuilder<TabbedPanelComponent, TabbedPanelLayout, any>;
	}

	export interface InputBoxProperties extends ComponentProperties {
		validationErrorMessage?: string;
	}

	export interface CheckBoxProperties {
		required?: boolean;
	}

	/**
	 * A property to be displayed in the PropertiesContainerComponent
	 */
	export interface PropertiesContainerItem {
		/**
		 * The name of the property to display
		 */
		displayName: string;
		/**
		 * The value of the property to display
		 */
		value: string;
	}

	/**
	 * Component to display a list of property values.
	 */
	export interface PropertiesContainerComponent extends Component, PropertiesContainerComponentProperties {

	}

	/**
	 * Properties for configuring a PropertiesContainerComponent
	 */
	export interface PropertiesContainerComponentProperties {
		/**
		 * The properties to display
		 */
		propertyItems?: PropertiesContainerItem[];
	}

	export namespace nb {
		/**
		 * An event that is emitted when the active Notebook editor is changed.
		 */
		export const onDidChangeActiveNotebookEditor: vscode.Event<NotebookEditor>;
	}

	export namespace window {
		export interface ModelViewDashboard {
			registerTabs(handler: (view: ModelView) => Thenable<(DashboardTab | DashboardTabGroup)[]>): void;
			open(): Thenable<void>;
			updateTabs(tabs: (DashboardTab | DashboardTabGroup)[]): void;
		}

		export function createModelViewDashboard(title: string, options?: ModelViewDashboardOptions): ModelViewDashboard;
	}

	export interface DashboardTab extends Tab {
		/**
		 * Toolbar of the tab, optional.
		 */
		toolbar?: ToolbarContainer;
	}

	export interface DashboardTabGroup {
		/**
		 * * Title of the tab group
		 */
		title: string;

		/**
		 * children of the tab group
		 */
		tabs: DashboardTab[];
	}

	export interface ModelViewDashboardOptions {
		/**
		 * Whether to show the tab icon, default is true
		 */
		showIcon?: boolean;

		/**
		 * Whether to show the tab navigation pane even when there is only one tab, default is false
		 */
		alwaysShowTabs?: boolean;
	}

	export interface Container<TLayout, TItemLayout> extends Component {
		setItemLayout(component: Component, layout: TItemLayout): void;
	}

	export interface TaskInfo {
		targetLocation?: string;
	}
}

