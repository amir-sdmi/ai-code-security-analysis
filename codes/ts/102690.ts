import {
  ApiConsistencyCheckModuleData,
  ApiConsistencyCheckModuleError,
  ApiConsistencyFixAllModulesSyntaxData,
  ApiConsistencyFixAllModulesSyntaxError,
  ApiConsistencyFixModuleSyntaxData,
  ApiConsistencyFixModuleSyntaxError,
  ApiDiagnosticsHealthCheckData,
  ApiFixerCheckApiConsistencyData,
  ApiFixerFixAllModulesSyntaxData,
  ApiFixerFixAllModulesSyntaxError,
  ApiFixerFixAllStringLiteralsData,
  ApiFixerFixAllStringLiteralsError,
  ApiFixerFixModuleSyntaxData,
  ApiFixerFixModuleSyntaxError,
  ApiFixerFixStringLiteralsData,
  ApiFixerFixStringLiteralsError,
  AppAnalyzerCheckAllHealthData,
  AppAnalyzerCheckApiConsistency2Data,
  AppAnalyzerCheckApiConsistencyData,
  AppAnalyzerCheckHealthData,
  AppAnalyzerGetAppAnalyzerInfoData,
  AppAnalyzerGetSettingsData,
  AppApisApiConsistencyFixAllRequest,
  AppApisApiConsistencyFixRequest,
  AppApisApiFixerFixAllRequest,
  AppApisCodeFixerV2FixRequest,
  AppApisCodeFixerV3FixRequest,
  AppApisDeepseekClientTextGenerationRequest,
  AppApisDeepseekWrapperTextGenerationRequest,
  AppApisDescriptionGeneratorGenerateDescriptionRequest,
  AppApisDescriptionGeneratorSaveVersionRequest,
  AppApisEnhancedMediaManagementBase64UploadRequest,
  AppApisMcpChatMCPChatRequest,
  AppApisMediaManagementV2Base64UploadRequest,
  AppApisModelContextProtocolMCPChatRequest,
  AppApisModuleDependencyRepairFixAllRequest,
  AppApisPropertyContentGenerateDescriptionRequest,
  AppApisPropertyContentSaveVersionRequest,
  AppApisPropertySearchPropertySearchRequest,
  AppApisSharedPropertySearchRequest,
  AppDiagnosticsCheckAuthData,
  AppDiagnosticsCheckAuthError,
  AppDiagnosticsCheckDiagnosticsData,
  AppSettingsGetV2Data,
  AppSettingsHealthCheckData,
  AuthCheckRequest,
  AuthServiceHealthCheckData,
  AvatarGenerationRequest,
  BatchDeleteMediaData,
  BatchDeleteMediaError,
  BatchGenerateIdeogramImagesData,
  BatchGenerateIdeogramImagesError,
  BatchGenerateImagesData,
  BatchGenerateImagesError,
  BatchIdeogramRequest,
  BatchImageRequest,
  BatchScheduleFollowUpsData,
  BatchScheduleFollowUpsError,
  BatchScheduleFollowUpsRequest,
  BodyBatchDeleteMedia,
  BodyCreateFolder,
  BodyFixStringLiterals3,
  BodyMoveMedia,
  BodyNaturalLanguageSearch,
  BodyPropertyFallbackUploadImage,
  BodyUnifiedPropertyApiUploadPropertyImage,
  BodyUpdatePropertyStatus,
  BodyUploadBase64Image,
  BodyUploadFromUrl,
  BodyUploadMedia,
  BodyUploadMedia2,
  BodyUploadMedia4,
  BodyUploadMediaBasic,
  BodyUploadPropertyImage,
  BodyUploadPropertyImageToSupabase2,
  BodyUploadPropertyImages,
  BodyUploadScript,
  BulkTargetingForCampaignsData,
  BulkTargetingForCampaignsError,
  BulkTargetingRequest,
  ChatChatData,
  ChatChatError,
  ChatData,
  ChatError,
  ChatRequest,
  ChatStreamData,
  ChatStreamError,
  CheckAllApiModulesData,
  CheckAllHealthEndpointsData,
  CheckAllModulesEndpointData,
  CheckAllModulesEndpointError,
  CheckAllRequest,
  CheckApiModuleData,
  CheckApiModuleError,
  CheckApiModuleParams,
  CheckDiagnosticsData,
  CheckHealth22Data,
  CheckHealth2Data,
  CheckHealthData,
  CheckHealthEndpointData,
  CheckHealthEndpointError,
  CheckHealthEndpointParams,
  CheckModuleEndpointData,
  CheckModuleEndpointError,
  CheckRequest,
  CodeFixerV2EnhancedCheckAllModulesData,
  CodeFixerV2EnhancedCheckModuleData,
  CodeFixerV2EnhancedCheckModuleError,
  CodeFixerV2EnhancedCheckModuleParams,
  CodeFixerV2EnhancedFixAdminSelectsData,
  CodeFixerV2EnhancedFixAllModulesData,
  CodeFixerV2EnhancedFixHomePageData,
  CodeFixerV2EnhancedFixModuleData,
  CodeFixerV2EnhancedFixModuleError,
  CodeFixerV2EnhancedFixPropertyEditSelectsData,
  CodeFixerV2EnhancedFixPropertyListingPageData,
  CodeFixerV3EnhancedCheckAllModulesData,
  CodeFixerV3EnhancedCheckModuleData,
  CodeFixerV3EnhancedCheckModuleError,
  CodeFixerV3EnhancedCheckModuleParams,
  CodeFixerV3EnhancedFixAdminSelectsData,
  CodeFixerV3EnhancedFixAllModulesData,
  CodeFixerV3EnhancedFixHomePageData,
  CodeFixerV3EnhancedFixModuleData,
  CodeFixerV3EnhancedFixModuleError,
  CodeFixerV3EnhancedFixPropertyEditSelectsData,
  CodeFixerV3EnhancedFixPropertyListingPageData,
  CodeReviewCheckDiagnosticsData,
  CodeReviewRequest,
  CodeReviewReviewCode2Data,
  CodeReviewReviewCode2Error,
  CodeReviewReviewCodeData,
  CodeReviewReviewCodeError,
  ConciergeChatRequest,
  ConciergeGenerateAvatarData,
  ConciergeGenerateAvatarError,
  ConciergeGetConversationsData,
  ConciergeGetConversationsError,
  ConciergeGetConversationsParams,
  ConciergeGetLeadsData,
  ConciergeGetLeadsError,
  ConciergeGetLeadsParams,
  ConciergeSettings,
  CreateCampaignEndpointData,
  CreateCampaignEndpointError,
  CreateCampaignEndpointParams,
  CreateCampaignEndpointPayload,
  CreateFolderData,
  CreateFolderError,
  CreatePropertyData,
  CreatePropertyError,
  CreatePropertyRequest,
  CreatePropertyStorageData,
  CreatePropertyStorageError,
  CreatePropertyStoragePayload,
  CrmGetConversationsData,
  CrmGetConversationsError,
  CrmGetConversationsParams,
  CrmGetLeadsData,
  CrmGetLeadsError,
  CrmGetLeadsParams,
  CrmIntegrationHealthCheckData,
  DalleRequest,
  DashboardRequest,
  DeepseekClientTextGenerationData,
  DeepseekClientTextGenerationError,
  DeepseekWrapperGeneratePromptData,
  DeepseekWrapperGeneratePromptError,
  DeepseekWrapperGeneratePromptParams,
  DeepseekWrapperGeneratePropertyData,
  DeepseekWrapperGeneratePropertyError,
  DeepseekWrapperTextGenerationData,
  DeepseekWrapperTextGenerationError,
  DeleteMediaData,
  DeleteMediaError,
  DeleteMediaParams,
  DeletePropertyData,
  DeletePropertyError,
  DeletePropertyFromSupabase2Data,
  DeletePropertyFromSupabase2Error,
  DeletePropertyFromSupabase2Params,
  DeletePropertyFromSupabaseData,
  DeletePropertyFromSupabaseError,
  DeletePropertyFromSupabaseParams,
  DeletePropertyParams,
  DeletePropertyStorageData,
  DeletePropertyStorageError,
  DeletePropertyStorageParams,
  DescriptionGeneratorGenerateDescriptionData,
  DescriptionGeneratorGenerateDescriptionError,
  DescriptionGeneratorGetVersionsData,
  DescriptionGeneratorGetVersionsError,
  DescriptionGeneratorSaveVersionData,
  DescriptionGeneratorSaveVersionError,
  EnhancedStringFixerFixAllStringLiteralsData,
  EnhancedStringFixerFixFileStringLiteralsData,
  EnhancedStringFixerFixFileStringLiteralsError,
  EnhancedStringFixerFixFileStringLiteralsParams,
  EnhancedStringFixerFixStringLiteralsData,
  EnhancedStringFixerFixStringLiteralsError,
  EnhancedStringFixerFixStringLiteralsParams,
  ExecuteCampaignEndpointData,
  ExecuteCampaignEndpointError,
  ExecuteCampaignEndpointParams,
  FixAllApiFilesEndpointData,
  FixAllModuleRoutersData,
  FixAllModuleRoutersError,
  FixAllModules2Data,
  FixAllModules3Data,
  FixAllModulesFixModuleData,
  FixAllModulesFixModuleError,
  FixAllModulesFixModuleParams,
  FixApiFileEndpointData,
  FixApiFileEndpointError,
  FixApiFileEndpointPayload,
  FixDuplicateEndpointsData,
  FixModuleFixAllModulesData,
  FixModuleFixStringLiteralsData,
  FixModuleFixStringLiteralsError,
  FixModuleFixStringLiteralsPayload,
  FixModuleRequest,
  FixModuleRouterData,
  FixModuleRouterError,
  FixOperationIdsData,
  FixPropertyDatabaseEndpointData,
  FixPropertyDatabaseEndpointError,
  FixPropertyDatabaseSchemaEndpointData,
  FixPropertyDatabaseSchemaEndpointError,
  FixPropertyDatabaseSchemaRequest,
  FixPropertyImagesRequest,
  FixPropertyTypesData,
  FixStringLiterals3Data,
  FixStringLiterals3Error,
  FixSupabaseQueryOrderData,
  FollowUpDashboardGetAnalyticsDashboardData,
  FollowUpDashboardGetAnalyticsDashboardError,
  FollowUpDashboardGetTimeSeriesMetricsData,
  FollowUpDashboardGetTimeSeriesMetricsError,
  FollowUpDashboardGetTopPerformingLeadsData,
  FollowUpDashboardGetTopPerformingLeadsError,
  GenPropertiesRequest,
  GenerateDalleImageData,
  GenerateDalleImageError,
  GenerateHeroImagesData,
  GenerateHeroImagesError,
  GenerateIdeogramImagesData,
  GenerateIdeogramImagesError,
  GenerateImagesData,
  GenerateImagesError,
  GenerateLuxuryPropertiesRequest,
  GenerateLuxuryVistaProperties22Data,
  GenerateLuxuryVistaProperties22Error,
  GenerateLuxuryVistaProperties2Data,
  GenerateLuxuryVistaProperties2Error,
  GenerateLuxuryVistaPropertiesData,
  GenerateLuxuryVistaPropertiesError,
  GenerateLuxuryVistaPropertiesPayload,
  GenerateMcpIdeogramData,
  GenerateMcpIdeogramError,
  GeneratePropertiesRequest,
  GeneratePropertyCardsData,
  GeneratePropertyCardsError,
  GeneratePropertyEndpointData,
  GeneratePropertyEndpointError,
  GeneratePropertyFacadeEndpointData,
  GeneratePropertyFacadeEndpointError,
  GenerateReengagementCampaignData,
  GenerateReengagementCampaignError,
  GenerateReengagementCampaignParams,
  GenerateTextRequest,
  GenericFacadeGeneratePropertyFacadeData,
  GenericFacadeGeneratePropertyFacadeError,
  GenericFacadeGeneratePropertyFacadeParams,
  GenericFacadeGetPropertiesFacadeData,
  GenericFacadeGetPropertiesFacadeError,
  GenericFacadeGetPropertiesFacadeParams,
  GenericFacadeGetPropertyFacadeData,
  GenericFacadeGetPropertyFacadeError,
  GenericFacadeGetPropertyFacadeParams,
  GetAppInfoData,
  GetAvatarPosesData,
  GetCampaignAnalyticsEndpointData,
  GetCampaignAnalyticsEndpointError,
  GetCampaignAnalyticsEndpointParams,
  GetCampaignTargetsEndpointData,
  GetCampaignTargetsEndpointError,
  GetCampaignTargetsEndpointParams,
  GetConciergeSettingsData,
  GetGenerationStatus22Data,
  GetGenerationStatus2Data,
  GetGenerationStatusData,
  GetHeroImagesData,
  GetLeadsDueForFollowupEndpointData,
  GetLocationByNameData,
  GetLocationByNameError,
  GetLocationByNameParams,
  GetLocationsData,
  GetMapTokenData,
  GetMapTokenError,
  GetMigrationProgressData,
  GetMigrationProgressError,
  GetMigrationProgressParams,
  GetMigrationStatusData,
  GetProfileData,
  GetPropertiesData,
  GetPropertiesError,
  GetPropertiesFromSupabase2Data,
  GetPropertiesFromSupabase2Error,
  GetPropertiesFromSupabase2Params,
  GetPropertiesFromSupabaseData,
  GetPropertiesFromSupabaseError,
  GetPropertiesFromSupabaseParams,
  GetPropertiesParams,
  GetPropertiesStorageData,
  GetPropertiesStorageError,
  GetPropertiesStorageParams,
  GetProperty2Data,
  GetProperty2Error,
  GetProperty2Params,
  GetPropertyCardsData,
  GetPropertyData,
  GetPropertyError,
  GetPropertyFacadeByIdData,
  GetPropertyFacadeByIdError,
  GetPropertyFacadeByIdParams,
  GetPropertyFacadeListData,
  GetPropertyFacadeListError,
  GetPropertyFacadeListParams,
  GetPropertyFromSupabase2Data,
  GetPropertyFromSupabase2Error,
  GetPropertyFromSupabase2Params,
  GetPropertyFromSupabaseData,
  GetPropertyFromSupabaseError,
  GetPropertyFromSupabaseParams,
  GetPropertyImagesStatusData,
  GetPropertyImagesStatusError,
  GetPropertyImagesStatusParams,
  GetPropertyImagesTableSqlData,
  GetPropertyParams,
  GetPropertyStorageData,
  GetPropertyStorageError,
  GetPropertyStorageParams,
  GetPropertyTypeByNameData,
  GetPropertyTypeByNameError,
  GetPropertyTypeByNameParams,
  GetVersionsRequest,
  HandleLeadHandoffData,
  HandleLeadHandoffError,
  HandleLeadHandoffParams,
  HealthCheckData,
  HeroImageRequest,
  IdeogramImageRequest,
  ImportPropertiesData,
  InitSupabaseSchemaData,
  InitializeCmsSchemaData,
  InitializeSchemaData,
  LeadPerformanceRequest,
  LeadTargetingRequest,
  ListCampaignsEndpointData,
  ListCampaignsEndpointError,
  ListCampaignsEndpointParams,
  ListMedia4Data,
  ListMedia4Error,
  ListMedia4Params,
  ListMediaData,
  ListMediaError,
  ListMediaParams,
  ListModulesData,
  ListPropertiesData,
  ListPropertiesError,
  ListPropertiesParams,
  ListPropertyTypesData,
  LocationCreate,
  LocationServiceHealthCheckData,
  LocationUpdate,
  MCPAvatarRequest,
  MCPIdeogramRequest,
  MCPRequest,
  MapTokenRequest,
  McpAvatarTestMcpData,
  McpCallMethodData,
  McpCallMethodError,
  McpCallMethodParams,
  McpChatData,
  McpChatEndpointData,
  McpChatEndpointError,
  McpChatError,
  McpChatTestMcpData,
  McpGenerateAvatarData,
  McpGenerateAvatarError,
  McpGenerateTokenData,
  McpGenerateTokenError,
  McpGetDocsData,
  McpGetDocsError,
  McpGetDocsParams,
  McpGetLogStatsData,
  McpGetLogStatsError,
  McpGetLogStatsParams,
  McpGetLogsData,
  McpGetLogsError,
  McpGetLogsParams,
  McpHealthCheckData,
  McpRunTestData,
  McpRunTestError,
  McpRunTestParams,
  McpRunTestSuiteData,
  McpRunTestSuiteError,
  McpRunTestSuiteParams,
  MediaDeleteMediaData,
  MediaDeleteMediaError,
  MediaDeleteMediaParams,
  MediaListMediaData,
  MediaManagementV2DeleteMediaData,
  MediaManagementV2DeleteMediaError,
  MediaManagementV2DeleteMediaParams,
  MediaManagementV2GetMigrationStatusData,
  MediaManagementV2ListMediaData,
  MediaManagementV2ListMediaError,
  MediaManagementV2ListMediaParams,
  MediaManagementV2MigrateIdeogramImagesData,
  MediaManagementV2SearchMediaData,
  MediaManagementV2SearchMediaError,
  MediaManagementV2SearchMediaParams,
  MediaManagementV2UploadBase64ImageData,
  MediaManagementV2UploadBase64ImageError,
  MediaManagementV2UploadFromUrlData,
  MediaManagementV2UploadFromUrlError,
  MediaMigrationGetMigrationStatusData,
  MediaMigrationMigrateIdeogramImagesData,
  MigratePropertiesData,
  MigratePropertiesError,
  MigratePropertyImagesBackgroundData,
  MigratePropertyImagesBackgroundError,
  MigratePropertyImagesData,
  MigratePropertyImagesError,
  MigrationRequest,
  ModuleDependencyRepairFixAllModulesApiData,
  ModuleDependencyRepairFixAllModulesApiError,
  ModuleDependencyRepairFixModuleApiData,
  ModuleDependencyRepairFixModuleApiError,
  ModuleFixRequest,
  ModuleFixerCheckAllModulesData,
  ModuleFixerCheckModuleData,
  ModuleFixerCheckModuleError,
  ModuleFixerFixAllModulesData,
  ModuleFixerFixModuleData,
  ModuleFixerFixModuleError,
  ModuleRequest,
  MoveMediaData,
  MoveMediaError,
  NaturalLanguageSearchData,
  NaturalLanguageSearchError,
  NormalizeFieldNamesData,
  OldCodeReviewRequest,
  OperationIdFixerScanData,
  OperationIdFixerScanError,
  PropertiesUpdateAllImagesData,
  PropertiesUpdateAllImagesError,
  PropertiesUpdateAllImagesParams,
  PropertyAdvancedSearchPropertiesData,
  PropertyAdvancedSearchPropertiesError,
  PropertyApiHealthCheckData,
  PropertyBaseInput,
  PropertyCardRequest,
  PropertyContentGenerateDescriptionData,
  PropertyContentGenerateDescriptionError,
  PropertyContentGetVersionsData,
  PropertyContentGetVersionsError,
  PropertyContentSaveVersionData,
  PropertyContentSaveVersionError,
  PropertyCreate,
  PropertyCreateRequest,
  PropertyFallbackCreateData,
  PropertyFallbackCreateError,
  PropertyFallbackCreatePayload,
  PropertyFallbackDeleteData,
  PropertyFallbackDeleteError,
  PropertyFallbackDeleteParams,
  PropertyFallbackGeneratePropertiesData,
  PropertyFallbackGeneratePropertiesError,
  PropertyFallbackGetByIdData,
  PropertyFallbackGetByIdError,
  PropertyFallbackGetByIdParams,
  PropertyFallbackGetListData,
  PropertyFallbackGetListError,
  PropertyFallbackGetListParams,
  PropertyFallbackUpdateData,
  PropertyFallbackUpdateError,
  PropertyFallbackUpdateParams,
  PropertyFallbackUploadImageData,
  PropertyFallbackUploadImageError,
  PropertyFallbackUploadImageParams,
  PropertyGenerationRequest,
  PropertyGeneratorGeneratePropertiesData,
  PropertyGeneratorGeneratePropertiesError,
  PropertyImageMigrationRequest,
  PropertyImageRequest,
  PropertyImageUploadModel,
  PropertyLocationsCreateData,
  PropertyLocationsCreateError,
  PropertyLocationsDeleteData,
  PropertyLocationsDeleteError,
  PropertyLocationsDeleteParams,
  PropertyLocationsGetAllData,
  PropertyLocationsGetAllError,
  PropertyLocationsGetAllParams,
  PropertyLocationsGetByNameData,
  PropertyLocationsGetByNameError,
  PropertyLocationsGetByNameParams,
  PropertyLocationsUpdateData,
  PropertyLocationsUpdateError,
  PropertyLocationsUpdateParams,
  PropertyModel,
  PropertySearchFilters,
  PropertySearchNlSearchData,
  PropertySearchNlSearchError,
  PropertySearchSearchData,
  PropertySearchSearchError,
  PropertyServiceHealthCheckData,
  PropertyTypesHealthCheckData,
  PropertyUpdate,
  PropertyUpdateRequest,
  RegenerateAllProperties2Data,
  RegenerateAllProperties2Error,
  RegenerateAllPropertiesData,
  RegenerateAllPropertiesError,
  RegeneratePropertiesRequest,
  ResetPasswordData,
  ResetPasswordError,
  ResetPasswordRequest,
  ResumeConversationWithContextData,
  ResumeConversationWithContextError,
  ResumeConversationWithContextParams,
  ReviewCode2Data,
  ReviewCode2Error,
  ReviewCodeData,
  ReviewCodeError,
  ReviewCodeRequest,
  RouterTextGenerationData,
  RouterTextGenerationError,
  RunAllFixesData,
  SavePropertyToSupabase2Data,
  SavePropertyToSupabase2Error,
  SavePropertyToSupabaseData,
  SavePropertyToSupabaseError,
  ScanRequest,
  ScheduleFollowUpEndpointData,
  ScheduleFollowUpEndpointError,
  ScheduleFollowUpRequest,
  SearchMediaData,
  SearchMediaError,
  SearchMediaRequest,
  SearchPropertiesFacadeData,
  SearchPropertiesFacadeError,
  SearchRequest,
  SeoTitleRequest,
  SeoTitleSubtitleData,
  SeoTitleSubtitleEnhancerData,
  SeoTitleSubtitleEnhancerError,
  SeoTitleSubtitleError,
  SeoTitleSubtitleRequest,
  SettingsGetSettingsData,
  SetupTestDatabaseData,
  SigninData,
  SigninError,
  SigninRequest,
  SignupData,
  SignupError,
  SignupRequest,
  StringFixer2CheckAllModulesData,
  StringFixer2CheckModuleData,
  StringFixer2CheckModuleError,
  StringFixer2CheckModuleParams,
  StringFixer2FixAllModulesData,
  StringFixer2FixStringLiteralsData,
  StringFixer2FixStringLiteralsError,
  StringFixer2FixStringLiteralsPayload,
  StringFixerFixAllModulesData,
  StringFixerFixModuleData,
  StringFixerFixModuleError,
  StringFixerFixModuleParams,
  StringLiteralFixerFixAllStringLiteralsData,
  StringLiteralFixerFixStringLiteralsData,
  StringLiteralFixerFixStringLiteralsError,
  StringLiteralFixerFixStringLiteralsParams,
  SyncLeadsToCrmData,
  SyncPropertiesToCrmData,
  TargetLeadsForFollowupData,
  TargetLeadsForFollowupError,
  TestCase,
  TestDatabaseConnectionData,
  TestGenerationData,
  TestMcpData,
  TestMcpIdeogramData,
  TestSupabaseConnectionData,
  TimeSeriesMetricsRequest,
  TokenRequest,
  TrackCampaignResponseEndpointData,
  TrackCampaignResponseEndpointError,
  TrackCampaignResponseEndpointParams,
  TranslateData,
  TranslateError,
  TranslateRequest,
  TriggerFollowUpEndpointData,
  TriggerFollowUpEndpointError,
  TriggerFollowUpRequest,
  UnifiedPropertyApiCreatePropertyData,
  UnifiedPropertyApiCreatePropertyError,
  UnifiedPropertyApiDeletePropertyData,
  UnifiedPropertyApiDeletePropertyError,
  UnifiedPropertyApiDeletePropertyParams,
  UnifiedPropertyApiGeneratePropertyData,
  UnifiedPropertyApiGetPropertiesData,
  UnifiedPropertyApiGetPropertiesError,
  UnifiedPropertyApiGetPropertiesParams,
  UnifiedPropertyApiGetPropertyData,
  UnifiedPropertyApiGetPropertyError,
  UnifiedPropertyApiGetPropertyParams,
  UnifiedPropertyApiHealthCheckData,
  UnifiedPropertyApiSearchPropertiesData,
  UnifiedPropertyApiSearchPropertiesError,
  UnifiedPropertyApiSearchPropertiesPayload,
  UnifiedPropertyApiUpdatePropertyData,
  UnifiedPropertyApiUpdatePropertyError,
  UnifiedPropertyApiUpdatePropertyParams,
  UnifiedPropertyApiUploadPropertyImageData,
  UnifiedPropertyApiUploadPropertyImageError,
  UnifiedPropertyApiUploadPropertyImageParams,
  UpdateConciergeSettingsData,
  UpdateConciergeSettingsError,
  UpdateMetadataData,
  UpdateMetadataError,
  UpdateMetadataParams,
  UpdateMetadataPayload,
  UpdateProfileData,
  UpdateProfileError,
  UpdateProfilePayload,
  UpdatePropertyData,
  UpdatePropertyError,
  UpdatePropertyImagesFormatData,
  UpdatePropertyImagesWithDalleData,
  UpdatePropertyParams,
  UpdatePropertyStatus2Data,
  UpdatePropertyStatus2Error,
  UpdatePropertyStatus2Params,
  UpdatePropertyStatusData,
  UpdatePropertyStatusError,
  UpdatePropertyStatusParams,
  UpdatePropertyStorageData,
  UpdatePropertyStorageError,
  UpdatePropertyStorageParams,
  UpdatePropertyStoragePayload,
  UploadBase64Image3Data,
  UploadBase64Image3Error,
  UploadBase64ImageData,
  UploadBase64ImageError,
  UploadFromUrlData,
  UploadFromUrlError,
  UploadMedia2Data,
  UploadMedia2Error,
  UploadMedia4Data,
  UploadMedia4Error,
  UploadMediaBasicData,
  UploadMediaBasicError,
  UploadMediaData,
  UploadMediaError,
  UploadPropertyImageData,
  UploadPropertyImageError,
  UploadPropertyImageParams,
  UploadPropertyImageStorageData,
  UploadPropertyImageStorageError,
  UploadPropertyImageStorageParams,
  UploadPropertyImageToSupabase2Data,
  UploadPropertyImageToSupabase2Error,
  UploadPropertyImageToSupabaseData,
  UploadPropertyImageToSupabaseError,
  UploadPropertyImageToSupabaseParams,
  UploadPropertyImagesData,
  UploadPropertyImagesError,
  UploadScriptData,
  UploadScriptError,
  UploadURLRequest,
  VectorSearchRequest,
  WeaviateClientGetPropertyByIdData,
  WeaviateClientGetPropertyByIdError,
  WeaviateClientGetPropertyByIdParams,
  WeaviateClientHealthCheckData,
  WeaviateClientSearchPropertiesData,
  WeaviateClientSearchPropertiesError,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get application information.
   *
   * @tags dbtn/module:apps
   * @name get_app_info
   * @summary Get App Info
   * @request GET:/routes/apps/info
   */
  get_app_info = (params: RequestParams = {}) =>
    this.request<GetAppInfoData, any>({
      path: `/routes/apps/info`,
      method: "GET",
      ...params,
    });

  /**
   * @description Upload and execute a script file (Python, JavaScript, TypeScript, or TSX)
   *
   * @tags dbtn/module:script_uploader
   * @name upload_script
   * @summary Upload Script
   * @request POST:/routes/script-uploader/upload-script
   */
  upload_script = (data: BodyUploadScript, params: RequestParams = {}) =>
    this.request<UploadScriptData, UploadScriptError>({
      path: `/routes/script-uploader/upload-script`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Test the PostgreSQL database connection
   *
   * @tags diagnostics, dbtn/module:database_test
   * @name test_database_connection
   * @summary Test Database Connection
   * @request GET:/routes/database-test/connection
   */
  test_database_connection = (params: RequestParams = {}) =>
    this.request<TestDatabaseConnectionData, any>({
      path: `/routes/database-test/connection`,
      method: "GET",
      ...params,
    });

  /**
   * @description Set up test tables in the PostgreSQL database
   *
   * @tags diagnostics, dbtn/module:database_test
   * @name setup_test_database
   * @summary Setup Test Database
   * @request POST:/routes/database-test/setup
   */
  setup_test_database = (params: RequestParams = {}) =>
    this.request<SetupTestDatabaseData, any>({
      path: `/routes/database-test/setup`,
      method: "POST",
      ...params,
    });

  /**
   * @description Initialize the CMS database schema
   *
   * @tags diagnostics, dbtn/module:database_test
   * @name initialize_cms_schema
   * @summary Initialize Cms Schema
   * @request POST:/routes/database-test/init-cms-schema
   */
  initialize_cms_schema = (params: RequestParams = {}) =>
    this.request<InitializeCmsSchemaData, any>({
      path: `/routes/database-test/init-cms-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Translate text from one language to another using OpenAI's GPT model. Includes retry logic with exponential backoff.
   *
   * @tags translation, dbtn/module:translation
   * @name translate
   * @summary Translate
   * @request POST:/routes/translate
   */
  translate = (data: TranslateRequest, params: RequestParams = {}) =>
    this.request<TranslateData, TranslateError>({
      path: `/routes/translate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate text using DeepSeek AI or OpenAI as fallback
   *
   * @tags ai, dbtn/module:router
   * @name router_text_generation
   * @summary Router Text Generation
   * @request POST:/routes/router-deepseek/generate
   */
  router_text_generation = (data: GenerateTextRequest, params: RequestParams = {}) =>
    this.request<RouterTextGenerationData, RouterTextGenerationError>({
      path: `/routes/router-deepseek/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate text using DeepSeek AI with OpenAI fallback
   *
   * @tags ai, dbtn/module:deepseek_client
   * @name deepseek_client_text_generation
   * @summary Deepseek Client Text Generation
   * @request POST:/routes/deepseek-client/generate
   */
  deepseek_client_text_generation = (data: AppApisDeepseekClientTextGenerationRequest, params: RequestParams = {}) =>
    this.request<DeepseekClientTextGenerationData, DeepseekClientTextGenerationError>({
      path: `/routes/deepseek-client/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Scan specified directory for duplicate operation IDs
   *
   * @tags utilities, dbtn/module:operation_id_fixer
   * @name operation_id_fixer_scan
   * @summary Scan For Conflicts
   * @request POST:/routes/operation-id-fixer/scan
   */
  operation_id_fixer_scan = (data: ScanRequest, params: RequestParams = {}) =>
    this.request<OperationIdFixerScanData, OperationIdFixerScanError>({
      path: `/routes/operation-id-fixer/scan`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Endpoint to fix property database schema.
   *
   * @tags dbtn/module:db_fix
   * @name fix_property_database_schema_endpoint
   * @summary Fix Property Database Schema Endpoint
   * @request POST:/routes/fix-property-database-schema
   */
  fix_property_database_schema_endpoint = (data: FixPropertyDatabaseSchemaRequest, params: RequestParams = {}) =>
    this.request<FixPropertyDatabaseSchemaEndpointData, FixPropertyDatabaseSchemaEndpointError>({
      path: `/routes/fix-property-database-schema`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Migrate images from Supabase storage to the property_images database table. This endpoint will: 1. Scan all Supabase storage buckets for image files 2. Extract property IDs from filenames 3. Create entries in the property_images table for each image 4. Link each image to its corresponding property
   *
   * @tags property-images, dbtn/module:property_image_migrator
   * @name migrate_property_images
   * @summary Migrate Property Images
   * @request POST:/routes/property-image-migrator/migrate-images
   */
  migrate_property_images = (data: PropertyImageMigrationRequest, params: RequestParams = {}) =>
    this.request<MigratePropertyImagesData, MigratePropertyImagesError>({
      path: `/routes/property-image-migrator/migrate-images`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Start a background task to migrate images from Supabase storage to the property_images database table.
   *
   * @tags property-images, dbtn/module:property_image_migrator
   * @name migrate_property_images_background
   * @summary Migrate Property Images Background
   * @request POST:/routes/property-image-migrator/migrate-images-background
   */
  migrate_property_images_background = (data: PropertyImageMigrationRequest, params: RequestParams = {}) =>
    this.request<MigratePropertyImagesBackgroundData, MigratePropertyImagesBackgroundError>({
      path: `/routes/property-image-migrator/migrate-images-background`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the SQL needed to create the property_images table in Supabase.
   *
   * @tags property-images, dbtn/module:property_image_migrator
   * @name get_property_images_table_sql
   * @summary Get Property Images Table Sql
   * @request GET:/routes/property-image-migrator/property-images-table-sql
   */
  get_property_images_table_sql = (params: RequestParams = {}) =>
    this.request<GetPropertyImagesTableSqlData, any>({
      path: `/routes/property-image-migrator/property-images-table-sql`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the progress of an ongoing or completed migration.
   *
   * @tags property-images, dbtn/module:property_image_migrator
   * @name get_migration_progress
   * @summary Get Migration Progress
   * @request GET:/routes/property-image-migrator/migration-progress/{progress_key}
   */
  get_migration_progress = ({ progressKey, ...query }: GetMigrationProgressParams, params: RequestParams = {}) =>
    this.request<GetMigrationProgressData, GetMigrationProgressError>({
      path: `/routes/property-image-migrator/migration-progress/${progressKey}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check if a specific module can be imported and has a router.
   *
   * @tags dbtn/module:module_checker
   * @name check_module_endpoint
   * @summary Check Module Endpoint
   * @request POST:/routes/module-checker/check-module
   */
  check_module_endpoint = (data: CheckRequest, params: RequestParams = {}) =>
    this.request<CheckModuleEndpointData, CheckModuleEndpointError>({
      path: `/routes/module-checker/check-module`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check all modules for import errors and router existence.
   *
   * @tags dbtn/module:module_checker
   * @name check_all_modules_endpoint
   * @summary Check All Modules Endpoint
   * @request POST:/routes/module-checker/check-all-modules
   */
  check_all_modules_endpoint = (data: CheckAllRequest, params: RequestParams = {}) =>
    this.request<CheckAllModulesEndpointData, CheckAllModulesEndpointError>({
      path: `/routes/module-checker/check-all-modules`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix unterminated string literals in a Python module by directly adding the missing quote Args: module_name: Name of the module to fix Returns: dict: Status of the operation
   *
   * @tags string-fixer, dbtn/module:string_fixer3
   * @name fix_string_literals3
   * @summary Fix String Literals3
   * @request POST:/routes/string-fixer3/fix-string-literals3
   */
  fix_string_literals3 = (data: BodyFixStringLiterals3, params: RequestParams = {}) =>
    this.request<FixStringLiterals3Data, FixStringLiterals3Error>({
      path: `/routes/string-fixer3/fix-string-literals3`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix unterminated string literals in all API modules Returns: dict: Status of operations
   *
   * @tags string-fixer, dbtn/module:string_fixer3
   * @name fix_all_modules3
   * @summary Fix All Modules3
   * @request POST:/routes/string-fixer3/fix-all-modules3
   */
  fix_all_modules3 = (params: RequestParams = {}) =>
    this.request<FixAllModules3Data, void>({
      path: `/routes/string-fixer3/fix-all-modules3`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix a single API file for unterminated strings.
   *
   * @tags code-utils, fixer-script, dbtn/module:fixer_script
   * @name fix_api_file_endpoint
   * @summary Fix Api File Endpoint
   * @request POST:/routes/fixer/fix-api-file
   */
  fix_api_file_endpoint = (data: FixApiFileEndpointPayload, params: RequestParams = {}) =>
    this.request<FixApiFileEndpointData, FixApiFileEndpointError>({
      path: `/routes/fixer/fix-api-file`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix all API files in the project for unterminated strings.
   *
   * @tags code-utils, fixer-script, dbtn/module:fixer_script
   * @name fix_all_api_files_endpoint
   * @summary Fix All Api Files Endpoint
   * @request POST:/routes/fixer/fix-all-api-files
   */
  fix_all_api_files_endpoint = (params: RequestParams = {}) =>
    this.request<FixAllApiFilesEndpointData, any>({
      path: `/routes/fixer/fix-all-api-files`,
      method: "POST",
      ...params,
    });

  /**
   * @description Generate SEO-optimized title and subtitle suggestions for luxury properties based on social media research. This endpoint analyzes trends from Instagram, Reddit, and Pinterest to suggest the most effective title and subtitle combinations for property listings in Brasilia. Args: request: Configuration for SEO suggestions including property details and location
   *
   * @tags seo, dbtn/module:seo
   * @name seo_title_subtitle
   * @summary Seo Title Subtitle
   * @request POST:/routes/seo/title-subtitle
   */
  seo_title_subtitle = (data: SeoTitleSubtitleRequest, params: RequestParams = {}) =>
    this.request<SeoTitleSubtitleData, SeoTitleSubtitleError>({
      path: `/routes/seo/title-subtitle`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update all properties to ensure they have proper images and storage format.
   *
   * @tags properties, dbtn/module:property_updater
   * @name update_property_images_format
   * @summary Update Property Images Format
   * @request POST:/routes/property-updater/update-all-property-images
   */
  update_property_images_format = (params: RequestParams = {}) =>
    this.request<UpdatePropertyImagesFormatData, any>({
      path: `/routes/property-updater/update-all-property-images`,
      method: "POST",
      ...params,
    });

  /**
   * @description Update all property images using DALL-E 3 to generate images specific to Brasília luxury real estate. This endpoint will generate new high-quality images for all properties in the database, using DALL-E 3 or DeepSeek to create photorealistic renders of Brasília luxury properties.
   *
   * @tags properties, dbtn/module:property_updater
   * @name update_property_images_with_dalle
   * @summary Update Property Images With Dalle
   * @request POST:/routes/property-updater/update-all-property-images2
   */
  update_property_images_with_dalle = (params: RequestParams = {}) =>
    this.request<UpdatePropertyImagesWithDalleData, any>({
      path: `/routes/property-updater/update-all-property-images2`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix the property database structure by migrating images from properties.images JSON to property_images table. This endpoint will: 1. Migrate all images from properties.images JSON to the property_images table 2. Resolve any circular dependencies in the module structure 3. Standardize the image data model 4. Implement better error handling
   *
   * @tags properties, dbtn/module:property_updater
   * @name fix_property_database_endpoint
   * @summary Fix Property Database Endpoint
   * @request POST:/routes/property-updater/fix-property-database
   */
  fix_property_database_endpoint = (data: FixPropertyImagesRequest, params: RequestParams = {}) =>
    this.request<FixPropertyDatabaseEndpointData, FixPropertyDatabaseEndpointError>({
      path: `/routes/property-updater/fix-property-database`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Regenerate luxury properties with enhanced data and images. This endpoint will completely refresh the property database with new luxury properties, each with detailed descriptions, features, and high-quality images. Args: request: Optional configuration for property regeneration background_tasks: Background tasks runner
   *
   * @tags properties, dbtn/module:property_updater
   * @name regenerate_all_properties2
   * @summary Regenerate All Properties
   * @request POST:/routes/property-updater/regenerate-all-properties
   */
  regenerate_all_properties2 = (data: RegeneratePropertiesRequest, params: RequestParams = {}) =>
    this.request<RegenerateAllProperties2Data, RegenerateAllProperties2Error>({
      path: `/routes/property-updater/regenerate-all-properties`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate images for a property using DALL-E
   *
   * @tags dbtn/module:property_images
   * @name generate_images
   * @summary Generate Images
   * @request POST:/routes/property-images/generate
   */
  generate_images = (data: PropertyImageRequest, params: RequestParams = {}) =>
    this.request<GenerateImagesData, GenerateImagesError>({
      path: `/routes/property-images/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Schedule batch image generation for multiple properties
   *
   * @tags dbtn/module:property_images
   * @name batch_generate_images
   * @summary Batch Generate Images
   * @request POST:/routes/property-images/batch-generate
   */
  batch_generate_images = (data: BatchImageRequest, params: RequestParams = {}) =>
    this.request<BatchGenerateImagesData, BatchGenerateImagesError>({
      path: `/routes/property-images/batch-generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get status of property images
   *
   * @tags dbtn/module:property_images
   * @name get_property_images_status
   * @summary Get Property Images Status
   * @request GET:/routes/property-images/status/{property_id}
   */
  get_property_images_status = ({ propertyId, ...query }: GetPropertyImagesStatusParams, params: RequestParams = {}) =>
    this.request<GetPropertyImagesStatusData, GetPropertyImagesStatusError>({
      path: `/routes/property-images/status/${propertyId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Save a generated property to Supabase.
   *
   * @tags dbtn/module:supabase_cms
   * @name save_property_to_supabase2
   * @summary Save Property To Supabase2
   * @request POST:/routes/save-property-to-supabase2
   */
  save_property_to_supabase2 = (data: PropertyCreateRequest, params: RequestParams = {}) =>
    this.request<SavePropertyToSupabase2Data, SavePropertyToSupabase2Error>({
      path: `/routes/save-property-to-supabase2`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get properties from Supabase with pagination.
   *
   * @tags dbtn/module:supabase_cms
   * @name get_properties_from_supabase2
   * @summary Get Properties From Supabase2
   * @request GET:/routes/get-properties-from-supabase2
   */
  get_properties_from_supabase2 = (query: GetPropertiesFromSupabase2Params, params: RequestParams = {}) =>
    this.request<GetPropertiesFromSupabase2Data, GetPropertiesFromSupabase2Error>({
      path: `/routes/get-properties-from-supabase2`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a property by ID from Supabase.
   *
   * @tags dbtn/module:supabase_cms
   * @name get_property_from_supabase2
   * @summary Get Property From Supabase2
   * @request GET:/routes/get-property-from-supabase2/{property_id}
   */
  get_property_from_supabase2 = (
    { propertyId, ...query }: GetPropertyFromSupabase2Params,
    params: RequestParams = {},
  ) =>
    this.request<GetPropertyFromSupabase2Data, GetPropertyFromSupabase2Error>({
      path: `/routes/get-property-from-supabase2/${propertyId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a property from Supabase.
   *
   * @tags dbtn/module:supabase_cms
   * @name delete_property_from_supabase2
   * @summary Delete Property From Supabase2
   * @request DELETE:/routes/delete-property-from-supabase2/{property_id}
   */
  delete_property_from_supabase2 = (
    { propertyId, ...query }: DeletePropertyFromSupabase2Params,
    params: RequestParams = {},
  ) =>
    this.request<DeletePropertyFromSupabase2Data, DeletePropertyFromSupabase2Error>({
      path: `/routes/delete-property-from-supabase2/${propertyId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Update a property's status.
   *
   * @tags dbtn/module:supabase_cms
   * @name update_property_status2
   * @summary Update Property Status2
   * @request PUT:/routes/update-property-status2/{property_id}
   */
  update_property_status2 = ({ propertyId, ...query }: UpdatePropertyStatus2Params, params: RequestParams = {}) =>
    this.request<UpdatePropertyStatus2Data, UpdatePropertyStatus2Error>({
      path: `/routes/update-property-status2/${propertyId}`,
      method: "PUT",
      query: query,
      ...params,
    });

  /**
   * @description Test the connection to Supabase.
   *
   * @tags dbtn/module:supabase_cms
   * @name test_supabase_connection
   * @summary Test Supabase Connection
   * @request POST:/routes/test-supabase-connection
   */
  test_supabase_connection = (params: RequestParams = {}) =>
    this.request<TestSupabaseConnectionData, any>({
      path: `/routes/test-supabase-connection`,
      method: "POST",
      ...params,
    });

  /**
   * @description Upload an image for a property and store it in Supabase storage.
   *
   * @tags dbtn/module:supabase_cms
   * @name upload_property_image_to_supabase2
   * @summary Upload Property Image To Supabase2
   * @request POST:/routes/upload-property-image-to-supabase2
   */
  upload_property_image_to_supabase2 = (data: BodyUploadPropertyImageToSupabase2, params: RequestParams = {}) =>
    this.request<UploadPropertyImageToSupabase2Data, UploadPropertyImageToSupabase2Error>({
      path: `/routes/upload-property-image-to-supabase2`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Fix the issue with SyncRequestBuilder missing order method.
   *
   * @tags dbtn/module:fix_issues
   * @name fix_supabase_query_order
   * @summary Fix Supabase Query Order
   * @request GET:/routes/fix-supabase-query-order
   */
  fix_supabase_query_order = (params: RequestParams = {}) =>
    this.request<FixSupabaseQueryOrderData, any>({
      path: `/routes/fix-supabase-query-order`,
      method: "GET",
      ...params,
    });

  /**
   * @description Run all available fixes.
   *
   * @tags dbtn/module:fix_issues
   * @name run_all_fixes
   * @summary Run All Fixes
   * @request GET:/routes/run-all-fixes
   */
  run_all_fixes = (params: RequestParams = {}) =>
    this.request<RunAllFixesData, any>({
      path: `/routes/run-all-fixes`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check the code review API is working
   *
   * @tags code_review, dbtn/module:code_review
   * @name code_review_check_diagnostics
   * @summary Check Diagnostics
   * @request POST:/routes/check_diagnostics
   */
  code_review_check_diagnostics = (params: RequestParams = {}) =>
    this.request<CodeReviewCheckDiagnosticsData, any>({
      path: `/routes/check_diagnostics`,
      method: "POST",
      ...params,
    });

  /**
   * @description Review code for common issues
   *
   * @tags code_review, dbtn/module:code_review
   * @name code_review_review_code2
   * @summary Review Code2
   * @request POST:/routes/review_code2
   */
  code_review_review_code2 = (data: CodeReviewRequest, params: RequestParams = {}) =>
    this.request<CodeReviewReviewCode2Data, CodeReviewReviewCode2Error>({
      path: `/routes/review_code2`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Review code using OpenAI's GPT model with retry logic (legacy endpoint)
   *
   * @tags code_review, dbtn/module:code_review
   * @name code_review_review_code
   * @summary Review Code
   * @request POST:/routes/review_code
   */
  code_review_review_code = (data: OldCodeReviewRequest, params: RequestParams = {}) =>
    this.request<CodeReviewReviewCodeData, CodeReviewReviewCodeError>({
      path: `/routes/review_code`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check a specific API module for consistency issues.
   *
   * @tags dbtn/module:api_consistency
   * @name api_consistency_check_module
   * @summary Check Api Consistency
   * @request POST:/routes/api-consistency/check-module
   */
  api_consistency_check_module = (data: CheckRequest, params: RequestParams = {}) =>
    this.request<ApiConsistencyCheckModuleData, ApiConsistencyCheckModuleError>({
      path: `/routes/api-consistency/check-module`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix syntax issues in a specific module.
   *
   * @tags dbtn/module:api_consistency
   * @name api_consistency_fix_module_syntax
   * @summary Fix Module Syntax Endpoint
   * @request POST:/routes/api-consistency/fix-module-syntax
   */
  api_consistency_fix_module_syntax = (data: AppApisApiConsistencyFixRequest, params: RequestParams = {}) =>
    this.request<ApiConsistencyFixModuleSyntaxData, ApiConsistencyFixModuleSyntaxError>({
      path: `/routes/api-consistency/fix-module-syntax`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix syntax issues in all modules.
   *
   * @tags dbtn/module:api_consistency
   * @name api_consistency_fix_all_modules_syntax
   * @summary Fix All Modules Syntax Endpoint
   * @request POST:/routes/api-consistency/fix-all-modules-syntax
   */
  api_consistency_fix_all_modules_syntax = (data: AppApisApiConsistencyFixAllRequest, params: RequestParams = {}) =>
    this.request<ApiConsistencyFixAllModulesSyntaxData, ApiConsistencyFixAllModulesSyntaxError>({
      path: `/routes/api-consistency/fix-all-modules-syntax`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix string literals in a specific module.
   *
   * @tags code-utils, string-fixer, dbtn/module:string_fixer
   * @name string_fixer_fix_module
   * @summary Fix Module Endpoint
   * @request POST:/routes/string-fixer-v1/fix-module
   */
  string_fixer_fix_module = (query: StringFixerFixModuleParams, params: RequestParams = {}) =>
    this.request<StringFixerFixModuleData, StringFixerFixModuleError>({
      path: `/routes/string-fixer-v1/fix-module`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Fix string literals in all API modules.
   *
   * @tags code-utils, string-fixer, dbtn/module:string_fixer
   * @name string_fixer_fix_all_modules
   * @summary Fix All Modules Endpoint
   * @request POST:/routes/string-fixer-v1/fix-all-modules
   */
  string_fixer_fix_all_modules = (params: RequestParams = {}) =>
    this.request<StringFixerFixAllModulesData, any>({
      path: `/routes/string-fixer-v1/fix-all-modules`,
      method: "POST",
      ...params,
    });

  /**
   * @description Generate a property description using AI
   *
   * @tags dbtn/module:property_content
   * @name property_content_generate_description
   * @summary Generate Description
   * @request POST:/routes/generate-description
   */
  property_content_generate_description = (
    data: AppApisPropertyContentGenerateDescriptionRequest,
    params: RequestParams = {},
  ) =>
    this.request<PropertyContentGenerateDescriptionData, PropertyContentGenerateDescriptionError>({
      path: `/routes/generate-description`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Save a version of property description to history
   *
   * @tags dbtn/module:property_content
   * @name property_content_save_version
   * @summary Save Version History
   * @request POST:/routes/save-version
   */
  property_content_save_version = (data: AppApisPropertyContentSaveVersionRequest, params: RequestParams = {}) =>
    this.request<PropertyContentSaveVersionData, PropertyContentSaveVersionError>({
      path: `/routes/save-version`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get version history for a property
   *
   * @tags dbtn/module:property_content
   * @name property_content_get_versions
   * @summary Get Version History
   * @request POST:/routes/get-versions
   */
  property_content_get_versions = (data: GetVersionsRequest, params: RequestParams = {}) =>
    this.request<PropertyContentGetVersionsData, PropertyContentGetVersionsError>({
      path: `/routes/get-versions`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate property cards with images for the LuxuryVista home page using Ideogram AI This endpoint generates high-quality, photorealistic property card images for the featured properties section on the home page using Ideogram AI.
   *
   * @tags dbtn/module:property_cards
   * @name generate_property_cards
   * @summary Generate Property Cards
   * @request POST:/routes/property-cards/generate
   */
  generate_property_cards = (data: PropertyCardRequest, params: RequestParams = {}) =>
    this.request<GeneratePropertyCardsData, GeneratePropertyCardsError>({
      path: `/routes/property-cards/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get property cards for the LuxuryVista home page This endpoint retrieves the currently saved property cards for the home page. If no cards exist, it will return an empty list.
   *
   * @tags dbtn/module:property_cards
   * @name get_property_cards
   * @summary Get Property Cards
   * @request GET:/routes/property-cards/get
   */
  get_property_cards = (params: RequestParams = {}) =>
    this.request<GetPropertyCardsData, any>({
      path: `/routes/property-cards/get`,
      method: "GET",
      ...params,
    });

  /**
   * @description Performs comprehensive diagnostic checks on the application. Tests all critical services and returns their status.
   *
   * @tags diagnostics, dbtn/module:app_diagnostics
   * @name app_diagnostics_check_diagnostics
   * @summary Check App Diagnostics
   * @request GET:/routes/check-diagnostics
   */
  app_diagnostics_check_diagnostics = (params: RequestParams = {}) =>
    this.request<AppDiagnosticsCheckDiagnosticsData, any>({
      path: `/routes/check-diagnostics`,
      method: "GET",
      ...params,
    });

  /**
   * @description Tests if the provided API key is valid (this is just a dummy endpoint)
   *
   * @tags diagnostics, dbtn/module:app_diagnostics
   * @name app_diagnostics_check_auth
   * @summary Check Auth
   * @request POST:/routes/check-auth
   */
  app_diagnostics_check_auth = (data: AuthCheckRequest, params: RequestParams = {}) =>
    this.request<AppDiagnosticsCheckAuthData, AppDiagnosticsCheckAuthError>({
      path: `/routes/check-auth`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate hero images for the LuxuryVista home page using Ideogram AI This endpoint generates high-quality, photorealistic hero images for the home page using Ideogram AI.
   *
   * @tags dbtn/module:hero_images
   * @name generate_hero_images
   * @summary Generate Hero Images
   * @request POST:/routes/hero-images/generate
   */
  generate_hero_images = (data: HeroImageRequest, params: RequestParams = {}) =>
    this.request<GenerateHeroImagesData, GenerateHeroImagesError>({
      path: `/routes/hero-images/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get hero images for the LuxuryVista home page This endpoint retrieves the currently saved hero images for the home page. If no images exist, it will return an empty list.
   *
   * @tags dbtn/module:hero_images
   * @name get_hero_images
   * @summary Get Hero Images Endpoint
   * @request GET:/routes/hero-images/get
   */
  get_hero_images = (params: RequestParams = {}) =>
    this.request<GetHeroImagesData, any>({
      path: `/routes/hero-images/get`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate images for a property using Ideogram AI This endpoint generates high-quality, photorealistic images for a property using Ideogram AI.
   *
   * @tags dbtn/module:ideogram_images
   * @name generate_ideogram_images
   * @summary Generate Ideogram Images
   * @request POST:/routes/ideogram-images/generate
   */
  generate_ideogram_images = (data: IdeogramImageRequest, params: RequestParams = {}) =>
    this.request<GenerateIdeogramImagesData, GenerateIdeogramImagesError>({
      path: `/routes/ideogram-images/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Schedule batch image generation for multiple properties using Ideogram AI This endpoint schedules background tasks to generate images for multiple properties.
   *
   * @tags dbtn/module:ideogram_images
   * @name batch_generate_ideogram_images
   * @summary Batch Generate Ideogram Images
   * @request POST:/routes/ideogram-images/batch-generate
   */
  batch_generate_ideogram_images = (data: BatchIdeogramRequest, params: RequestParams = {}) =>
    this.request<BatchGenerateIdeogramImagesData, BatchGenerateIdeogramImagesError>({
      path: `/routes/ideogram-images/batch-generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Returns a MapBox API token for the frontend to use.
   *
   * @tags dbtn/module:mapbox
   * @name get_map_token
   * @summary Get Map Token
   * @request POST:/routes/map-token
   */
  get_map_token = (data: MapTokenRequest, params: RequestParams = {}) =>
    this.request<GetMapTokenData, GetMapTokenError>({
      path: `/routes/map-token`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate an image using MCP with Ideogram
   *
   * @tags ai-images, dbtn/module:mcp_ideogram
   * @name generate_mcp_ideogram
   * @summary Generate Mcp Ideogram
   * @request POST:/routes/mcp-ideogram/generate
   */
  generate_mcp_ideogram = (data: MCPIdeogramRequest, params: RequestParams = {}) =>
    this.request<GenerateMcpIdeogramData, GenerateMcpIdeogramError>({
      path: `/routes/mcp-ideogram/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Test MCP Ideogram integration
   *
   * @tags ai-images, dbtn/module:mcp_ideogram
   * @name test_mcp_ideogram
   * @summary Test Mcp Ideogram
   * @request GET:/routes/mcp-ideogram/test
   */
  test_mcp_ideogram = (params: RequestParams = {}) =>
    this.request<TestMcpIdeogramData, any>({
      path: `/routes/mcp-ideogram/test`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check the health of the unified property API.
   *
   * @tags properties, dbtn/module:unified_property_api
   * @name unified_property_api_health_check
   * @summary Unified Property Api Check Health
   * @request GET:/routes/property/health
   */
  unified_property_api_health_check = (params: RequestParams = {}) =>
    this.request<UnifiedPropertyApiHealthCheckData, any>({
      path: `/routes/property/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new property using available modules.
   *
   * @tags properties, dbtn/module:unified_property_api
   * @name unified_property_api_create_property
   * @summary Unified Property Api Create Property
   * @request POST:/routes/property/properties
   */
  unified_property_api_create_property = (data: CreatePropertyRequest, params: RequestParams = {}) =>
    this.request<UnifiedPropertyApiCreatePropertyData, UnifiedPropertyApiCreatePropertyError>({
      path: `/routes/property/properties`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all properties using available modules. Returns a list of properties or a dictionary with properties and pagination info. Falls back to different implementations based on availability.
   *
   * @tags properties, dbtn/module:unified_property_api
   * @name unified_property_api_get_properties
   * @summary Unified Property Api Get Properties
   * @request GET:/routes/property/properties
   */
  unified_property_api_get_properties = (query: UnifiedPropertyApiGetPropertiesParams, params: RequestParams = {}) =>
    this.request<UnifiedPropertyApiGetPropertiesData, UnifiedPropertyApiGetPropertiesError>({
      path: `/routes/property/properties`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a property by ID using available modules. Returns the property details if found, or an error response if not found or if an error occurs during retrieval.
   *
   * @tags properties, dbtn/module:unified_property_api
   * @name unified_property_api_get_property
   * @summary Unified Property Api Get Property
   * @request GET:/routes/property/properties/{property_id}
   */
  unified_property_api_get_property = (
    { propertyId, ...query }: UnifiedPropertyApiGetPropertyParams,
    params: RequestParams = {},
  ) =>
    this.request<UnifiedPropertyApiGetPropertyData, UnifiedPropertyApiGetPropertyError>({
      path: `/routes/property/properties/${propertyId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update a property by ID using available modules.
   *
   * @tags properties, dbtn/module:unified_property_api
   * @name unified_property_api_update_property
   * @summary Unified Property Api Update Property
   * @request PUT:/routes/property/properties/{property_id}
   */
  unified_property_api_update_property = (
    { propertyId, ...query }: UnifiedPropertyApiUpdatePropertyParams,
    data: PropertyBaseInput,
    params: RequestParams = {},
  ) =>
    this.request<UnifiedPropertyApiUpdatePropertyData, UnifiedPropertyApiUpdatePropertyError>({
      path: `/routes/property/properties/${propertyId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a property by ID using available modules.
   *
   * @tags properties, dbtn/module:unified_property_api
   * @name unified_property_api_delete_property
   * @summary Unified Property Api Delete Property
   * @request DELETE:/routes/property/properties/{property_id}
   */
  unified_property_api_delete_property = (
    { propertyId, ...query }: UnifiedPropertyApiDeletePropertyParams,
    params: RequestParams = {},
  ) =>
    this.request<UnifiedPropertyApiDeletePropertyData, UnifiedPropertyApiDeletePropertyError>({
      path: `/routes/property/properties/${propertyId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Upload an image for a property using available modules. Attempts to upload using the most reliable implementation available.
   *
   * @tags properties, dbtn/module:unified_property_api
   * @name unified_property_api_upload_property_image
   * @summary Unified Property Api Upload Property Image
   * @request POST:/routes/property/properties/{property_id}/upload-image
   */
  unified_property_api_upload_property_image = (
    { propertyId, ...query }: UnifiedPropertyApiUploadPropertyImageParams,
    data: BodyUnifiedPropertyApiUploadPropertyImage,
    params: RequestParams = {},
  ) =>
    this.request<UnifiedPropertyApiUploadPropertyImageData, UnifiedPropertyApiUploadPropertyImageError>({
      path: `/routes/property/properties/${propertyId}/upload-image`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Search for properties using available modules.
   *
   * @tags properties, dbtn/module:unified_property_api
   * @name unified_property_api_search_properties
   * @summary Unified Property Api Search Properties
   * @request POST:/routes/property/properties/search
   */
  unified_property_api_search_properties = (
    data: UnifiedPropertyApiSearchPropertiesPayload,
    params: RequestParams = {},
  ) =>
    this.request<UnifiedPropertyApiSearchPropertiesData, UnifiedPropertyApiSearchPropertiesError>({
      path: `/routes/property/properties/search`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate a property using AI.
   *
   * @tags properties, dbtn/module:unified_property_api
   * @name unified_property_api_generate_property
   * @summary Unified Property Api Generate Property
   * @request POST:/routes/property/properties/generate
   */
  unified_property_api_generate_property = (params: RequestParams = {}) =>
    this.request<UnifiedPropertyApiGeneratePropertyData, any>({
      path: `/routes/property/properties/generate`,
      method: "POST",
      ...params,
    });

  /**
   * @description Register a new user and create their profile.
   *
   * @tags authentication, dbtn/module:auth_service
   * @name signup
   * @summary Signup
   * @request POST:/routes/auth/signup
   */
  signup = (data: SignupRequest, params: RequestParams = {}) =>
    this.request<SignupData, SignupError>({
      path: `/routes/auth/signup`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Sign in a user and return their profile.
   *
   * @tags authentication, dbtn/module:auth_service
   * @name signin
   * @summary Signin
   * @request POST:/routes/auth/signin
   */
  signin = (data: SigninRequest, params: RequestParams = {}) =>
    this.request<SigninData, SigninError>({
      path: `/routes/auth/signin`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Send a password reset email to the user.
   *
   * @tags authentication, dbtn/module:auth_service
   * @name reset_password
   * @summary Reset Password
   * @request POST:/routes/auth/reset-password
   */
  reset_password = (data: ResetPasswordRequest, params: RequestParams = {}) =>
    this.request<ResetPasswordData, ResetPasswordError>({
      path: `/routes/auth/reset-password`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the authenticated user's profile.
   *
   * @tags authentication, dbtn/module:auth_service
   * @name get_profile
   * @summary Get Profile
   * @request GET:/routes/auth/profile
   * @secure
   */
  get_profile = (params: RequestParams = {}) =>
    this.request<GetProfileData, any>({
      path: `/routes/auth/profile`,
      method: "GET",
      secure: true,
      ...params,
    });

  /**
   * @description Update the authenticated user's profile.
   *
   * @tags authentication, dbtn/module:auth_service
   * @name update_profile
   * @summary Update Profile
   * @request PUT:/routes/auth/profile
   * @secure
   */
  update_profile = (data: UpdateProfilePayload, params: RequestParams = {}) =>
    this.request<UpdateProfileData, UpdateProfileError>({
      path: `/routes/auth/profile`,
      method: "PUT",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check endpoint for the auth service.
   *
   * @tags authentication, dbtn/module:auth_service
   * @name auth_service_health_check
   * @summary Auth Service Health Check
   * @request GET:/routes/auth/check-health
   */
  auth_service_health_check = (params: RequestParams = {}) =>
    this.request<AuthServiceHealthCheckData, any>({
      path: `/routes/auth/check-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check all API modules for issues.
   *
   * @tags api-diagnostics, dbtn/module:api_diagnostics
   * @name check_all_api_modules
   * @summary Check All Api Modules
   * @request GET:/routes/api-diagnostics/check-all
   */
  check_all_api_modules = (params: RequestParams = {}) =>
    this.request<CheckAllApiModulesData, any>({
      path: `/routes/api-diagnostics/check-all`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check a specific API module for issues.
   *
   * @tags api-diagnostics, dbtn/module:api_diagnostics
   * @name check_api_module
   * @summary Check Api Module
   * @request GET:/routes/api-diagnostics/check-module/{module_name}
   */
  check_api_module = ({ moduleName, ...query }: CheckApiModuleParams, params: RequestParams = {}) =>
    this.request<CheckApiModuleData, CheckApiModuleError>({
      path: `/routes/api-diagnostics/check-module/${moduleName}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fix duplicate endpoints by disabling them in problematic modules.
   *
   * @tags api-diagnostics, dbtn/module:api_diagnostics
   * @name fix_duplicate_endpoints
   * @summary Fix Duplicate Endpoints
   * @request POST:/routes/api-diagnostics/fix-duplicates
   */
  fix_duplicate_endpoints = (params: RequestParams = {}) =>
    this.request<FixDuplicateEndpointsData, any>({
      path: `/routes/api-diagnostics/fix-duplicates`,
      method: "POST",
      ...params,
    });

  /**
   * @description Health check endpoint for the API diagnostics module.
   *
   * @tags api-diagnostics, dbtn/module:api_diagnostics
   * @name api_diagnostics_health_check
   * @summary Api Diagnostics Health Check
   * @request GET:/routes/api-diagnostics/check-health
   */
  api_diagnostics_health_check = (params: RequestParams = {}) =>
    this.request<ApiDiagnosticsHealthCheckData, any>({
      path: `/routes/api-diagnostics/check-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get application settings for the frontend
   *
   * @tags app-settings, dbtn/module:app_settings
   * @name app_settings_get_v2
   * @summary Get App Settings
   * @request GET:/routes/app-settings/
   */
  app_settings_get_v2 = (params: RequestParams = {}) =>
    this.request<AppSettingsGetV2Data, any>({
      path: `/routes/app-settings/`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check endpoint for the app settings module.
   *
   * @tags app-settings, dbtn/module:app_settings
   * @name app_settings_health_check
   * @summary App Settings Health Check
   * @request GET:/routes/app-settings/check-health
   */
  app_settings_health_check = (params: RequestParams = {}) =>
    this.request<AppSettingsHealthCheckData, any>({
      path: `/routes/app-settings/check-health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all available property locations Returns a list of locations where properties can be located. Each location includes a name, city, state, country, and coordinates.
   *
   * @tags property-locations, dbtn/module:property_locations
   * @name property_locations_get_all
   * @summary Get Locations
   * @request GET:/routes/property-locations
   */
  property_locations_get_all = (query: PropertyLocationsGetAllParams, params: RequestParams = {}) =>
    this.request<PropertyLocationsGetAllData, PropertyLocationsGetAllError>({
      path: `/routes/property-locations`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create a new location Creates a new property location with the provided details.
   *
   * @tags property-locations, dbtn/module:property_locations
   * @name property_locations_create
   * @summary Create Location
   * @request POST:/routes/property-locations
   */
  property_locations_create = (data: LocationCreate, params: RequestParams = {}) =>
    this.request<PropertyLocationsCreateData, PropertyLocationsCreateError>({
      path: `/routes/property-locations`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get a specific location by name Returns details for a specific location identified by its name.
   *
   * @tags property-locations, dbtn/module:property_locations
   * @name property_locations_get_by_name
   * @summary Get Location By Name
   * @request GET:/routes/property-locations/{location_name}
   */
  property_locations_get_by_name = (
    { locationName, ...query }: PropertyLocationsGetByNameParams,
    params: RequestParams = {},
  ) =>
    this.request<PropertyLocationsGetByNameData, PropertyLocationsGetByNameError>({
      path: `/routes/property-locations/${locationName}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update a location Updates an existing property location with the provided details.
   *
   * @tags property-locations, dbtn/module:property_locations
   * @name property_locations_update
   * @summary Update Location
   * @request PATCH:/routes/property-locations/{location_id}
   */
  property_locations_update = (
    { locationId, ...query }: PropertyLocationsUpdateParams,
    data: LocationUpdate,
    params: RequestParams = {},
  ) =>
    this.request<PropertyLocationsUpdateData, PropertyLocationsUpdateError>({
      path: `/routes/property-locations/${locationId}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a location Deletes an existing property location by its ID.
   *
   * @tags property-locations, dbtn/module:property_locations
   * @name property_locations_delete
   * @summary Delete Location
   * @request DELETE:/routes/property-locations/{location_id}
   */
  property_locations_delete = ({ locationId, ...query }: PropertyLocationsDeleteParams, params: RequestParams = {}) =>
    this.request<PropertyLocationsDeleteData, PropertyLocationsDeleteError>({
      path: `/routes/property-locations/${locationId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Health check endpoint for the location service Checks the health of the location service, including Supabase connectivity.
   *
   * @tags property-locations, system, dbtn/module:property_locations
   * @name location_service_health_check
   * @summary Property Locations Health Check
   * @request GET:/routes/property-locations/system/health
   */
  location_service_health_check = (params: RequestParams = {}) =>
    this.request<LocationServiceHealthCheckData, any>({
      path: `/routes/property-locations/system/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all available property types Returns a list of property types available for creating or filtering properties. Each type includes a name, description, and optional category.
   *
   * @tags property-types, dbtn/module:property_types
   * @name list_property_types
   * @summary Get Property Types
   * @request GET:/routes/property-types
   */
  list_property_types = (params: RequestParams = {}) =>
    this.request<ListPropertyTypesData, any>({
      path: `/routes/property-types`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a specific property type by name Returns details for a specific property type identified by its name.
   *
   * @tags property-types, dbtn/module:property_types
   * @name get_property_type_by_name
   * @summary Get Property Type By Name
   * @request GET:/routes/property-types/{type_name}
   */
  get_property_type_by_name = ({ typeName, ...query }: GetPropertyTypeByNameParams, params: RequestParams = {}) =>
    this.request<GetPropertyTypeByNameData, GetPropertyTypeByNameError>({
      path: `/routes/property-types/${typeName}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check endpoint for the property types service Checks the health of the property types service.
   *
   * @tags property-types, system, dbtn/module:property_types
   * @name property_types_health_check
   * @summary Property Types Health Check
   * @request GET:/routes/property-types/system/health
   */
  property_types_health_check = (params: RequestParams = {}) =>
    this.request<PropertyTypesHealthCheckData, any>({
      path: `/routes/property-types/system/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get application settings.
   *
   * @tags dbtn/module:settings
   * @name settings_get_settings
   * @summary Settings Get Settings
   * @request GET:/routes/settings
   */
  settings_get_settings = (params: RequestParams = {}) =>
    this.request<SettingsGetSettingsData, any>({
      path: `/routes/settings`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check if the property API and its dependencies are working correctly.
   *
   * @tags property-api, dbtn/module:property_api
   * @name property_api_health_check
   * @summary Property Api Health Check
   * @request GET:/routes/property-api/health
   */
  property_api_health_check = (params: RequestParams = {}) =>
    this.request<PropertyApiHealthCheckData, any>({
      path: `/routes/property-api/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a paginated list of properties.
   *
   * @tags property-api, dbtn/module:property_api
   * @name get_properties
   * @summary Property Api Get Properties
   * @request GET:/routes/property-api/properties
   */
  get_properties = (query: GetPropertiesParams, params: RequestParams = {}) =>
    this.request<GetPropertiesData, GetPropertiesError>({
      path: `/routes/property-api/properties`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get details for a specific property.
   *
   * @tags property-api, dbtn/module:property_api
   * @name get_property
   * @summary Property Api Get Property
   * @request GET:/routes/property-api/properties/{property_id}
   */
  get_property = ({ propertyId, ...query }: GetPropertyParams, params: RequestParams = {}) =>
    this.request<GetPropertyData, GetPropertyError>({
      path: `/routes/property-api/properties/${propertyId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Search for properties based on the provided criteria.
   *
   * @tags dbtn/module:property_advanced_search
   * @name property_advanced_search_properties
   * @summary Property Advanced Search Properties
   * @request POST:/routes/property-search
   */
  property_advanced_search_properties = (data: SearchRequest, params: RequestParams = {}) =>
    this.request<PropertyAdvancedSearchPropertiesData, PropertyAdvancedSearchPropertiesError>({
      path: `/routes/property-search`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Save a property to Supabase CMS. This endpoint takes a property object and persists it in the Supabase database. If the property has an ID, it will be used, otherwise a new ID will be generated.
   *
   * @tags property-persistence, dbtn/module:property_persistence
   * @name save_property_to_supabase
   * @summary Save Property To Supabase
   * @request POST:/routes/property-persistence/properties
   */
  save_property_to_supabase = (data: PropertyModel, params: RequestParams = {}) =>
    this.request<SavePropertyToSupabaseData, SavePropertyToSupabaseError>({
      path: `/routes/property-persistence/properties`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get properties from Supabase CMS with pagination and filtering.
   *
   * @tags property-persistence, dbtn/module:property_persistence
   * @name get_properties_from_supabase
   * @summary Get Properties From Supabase
   * @request GET:/routes/property-persistence/properties
   */
  get_properties_from_supabase = (query: GetPropertiesFromSupabaseParams, params: RequestParams = {}) =>
    this.request<GetPropertiesFromSupabaseData, GetPropertiesFromSupabaseError>({
      path: `/routes/property-persistence/properties`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a property by ID from Supabase CMS.
   *
   * @tags property-persistence, dbtn/module:property_persistence
   * @name get_property_from_supabase
   * @summary Get Property From Supabase
   * @request GET:/routes/property-persistence/properties/{property_id}
   */
  get_property_from_supabase = ({ propertyId, ...query }: GetPropertyFromSupabaseParams, params: RequestParams = {}) =>
    this.request<GetPropertyFromSupabaseData, GetPropertyFromSupabaseError>({
      path: `/routes/property-persistence/properties/${propertyId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a property from Supabase CMS.
   *
   * @tags property-persistence, dbtn/module:property_persistence
   * @name delete_property_from_supabase
   * @summary Delete Property From Supabase
   * @request DELETE:/routes/property-persistence/properties/{property_id}
   */
  delete_property_from_supabase = (
    { propertyId, ...query }: DeletePropertyFromSupabaseParams,
    params: RequestParams = {},
  ) =>
    this.request<DeletePropertyFromSupabaseData, DeletePropertyFromSupabaseError>({
      path: `/routes/property-persistence/properties/${propertyId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Update a property's status (draft/published) in Supabase CMS.
   *
   * @tags property-persistence, dbtn/module:property_persistence
   * @name update_property_status
   * @summary Update Property Status
   * @request PUT:/routes/property-persistence/properties/{property_id}/status
   */
  update_property_status = (
    { propertyId, ...query }: UpdatePropertyStatusParams,
    data: BodyUpdatePropertyStatus,
    params: RequestParams = {},
  ) =>
    this.request<UpdatePropertyStatusData, UpdatePropertyStatusError>({
      path: `/routes/property-persistence/properties/${propertyId}/status`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Upload an image for a property to Supabase storage.
   *
   * @tags property-persistence, dbtn/module:property_persistence
   * @name upload_property_image_to_supabase
   * @summary Property Persistence Upload Property Image
   * @request POST:/routes/property-persistence/properties/{property_id}/images
   */
  upload_property_image_to_supabase = (
    { propertyId, ...query }: UploadPropertyImageToSupabaseParams,
    data: PropertyImageUploadModel,
    params: RequestParams = {},
  ) =>
    this.request<UploadPropertyImageToSupabaseData, UploadPropertyImageToSupabaseError>({
      path: `/routes/property-persistence/properties/${propertyId}/images`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix string literals in a specific module.
   *
   * @tags code-utils, string-fixer, dbtn/module:string_literal_fixer
   * @name string_literal_fixer_fix_string_literals
   * @summary String Literal Fixer Fix String Literals
   * @request POST:/routes/string-fixer/fix-string-literals
   */
  string_literal_fixer_fix_string_literals = (
    query: StringLiteralFixerFixStringLiteralsParams,
    params: RequestParams = {},
  ) =>
    this.request<StringLiteralFixerFixStringLiteralsData, StringLiteralFixerFixStringLiteralsError>({
      path: `/routes/string-fixer/fix-string-literals`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Fix string literals in all API modules.
   *
   * @tags code-utils, string-fixer, dbtn/module:string_literal_fixer
   * @name string_literal_fixer_fix_all_string_literals
   * @summary Fix All String Literals Endpoint
   * @request POST:/routes/string-fixer/fix-all-string-literals
   */
  string_literal_fixer_fix_all_string_literals = (params: RequestParams = {}) =>
    this.request<StringLiteralFixerFixAllStringLiteralsData, any>({
      path: `/routes/string-fixer/fix-all-string-literals`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix string literals in a specific module.
   *
   * @tags code-utils, syntax-fixer, dbtn/module:enhanced_string_fixer
   * @name enhanced_string_fixer_fix_string_literals
   * @summary Enhanced String Fixer Fix String Literals
   * @request POST:/routes/code-utils/fix-string-literals
   */
  enhanced_string_fixer_fix_string_literals = (
    query: EnhancedStringFixerFixStringLiteralsParams,
    params: RequestParams = {},
  ) =>
    this.request<EnhancedStringFixerFixStringLiteralsData, EnhancedStringFixerFixStringLiteralsError>({
      path: `/routes/code-utils/fix-string-literals`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Fix string literals in all API modules.
   *
   * @tags code-utils, syntax-fixer, dbtn/module:enhanced_string_fixer
   * @name enhanced_string_fixer_fix_all_string_literals
   * @summary Enhanced String Fixer Fix All String Literals
   * @request POST:/routes/code-utils/fix-all-string-literals
   */
  enhanced_string_fixer_fix_all_string_literals = (params: RequestParams = {}) =>
    this.request<EnhancedStringFixerFixAllStringLiteralsData, any>({
      path: `/routes/code-utils/fix-all-string-literals`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix string literals in a specific file path.
   *
   * @tags code-utils, syntax-fixer, dbtn/module:enhanced_string_fixer
   * @name enhanced_string_fixer_fix_file_string_literals
   * @summary Fix File String Literals Endpoint
   * @request POST:/routes/code-utils/fix-file
   */
  enhanced_string_fixer_fix_file_string_literals = (
    query: EnhancedStringFixerFixFileStringLiteralsParams,
    params: RequestParams = {},
  ) =>
    this.request<EnhancedStringFixerFixFileStringLiteralsData, EnhancedStringFixerFixFileStringLiteralsError>({
      path: `/routes/code-utils/fix-file`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Fix string literals in a specific module.
   *
   * @tags fix-modules, dbtn/module:fix_all_modules
   * @name fix_all_modules_fix_module
   * @summary Fix All Modules Fix Module
   * @request GET:/routes/fix-all-modules/fix_module/{module_name}
   */
  fix_all_modules_fix_module = ({ moduleName, ...query }: FixAllModulesFixModuleParams, params: RequestParams = {}) =>
    this.request<FixAllModulesFixModuleData, FixAllModulesFixModuleError>({
      path: `/routes/fix-all-modules/fix_module/${moduleName}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fix string literals in all modules.
   *
   * @tags fix-modules, dbtn/module:fix_all_modules
   * @name fix_all_modules2
   * @summary Fix All Modules2
   * @request GET:/routes/fix-all-modules/fix_all
   */
  fix_all_modules2 = (params: RequestParams = {}) =>
    this.request<FixAllModules2Data, any>({
      path: `/routes/fix-all-modules/fix_all`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fix unterminated string literals in a Python module. Args: module_name: The name of the module to fix (e.g., "settings") Returns: dict: Results of the fix operation
   *
   * @tags code-fixer, dbtn/module:fix_module
   * @name fix_module_fix_string_literals
   * @summary Fix Module Fix String Literals
   * @request POST:/routes/fix-module/fix-string-literals
   */
  fix_module_fix_string_literals = (data: FixModuleFixStringLiteralsPayload, params: RequestParams = {}) =>
    this.request<FixModuleFixStringLiteralsData, FixModuleFixStringLiteralsError>({
      path: `/routes/fix-module/fix-string-literals`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix unterminated string literals in all API modules. Returns: dict: Results of fix operations
   *
   * @tags code-fixer, dbtn/module:fix_module
   * @name fix_module_fix_all_modules
   * @summary Fix Module Fix All Modules
   * @request POST:/routes/fix-module/fix-all-modules
   */
  fix_module_fix_all_modules = (params: RequestParams = {}) =>
    this.request<FixModuleFixAllModulesData, void>({
      path: `/routes/fix-module/fix-all-modules`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check module for common issues.
   *
   * @tags utils, dbtn/module:module_fixer
   * @name module_fixer_check_module
   * @summary Module Fixer Check Module
   * @request POST:/routes/module-fixer/review
   */
  module_fixer_check_module = (data: ModuleFixRequest, params: RequestParams = {}) =>
    this.request<ModuleFixerCheckModuleData, ModuleFixerCheckModuleError>({
      path: `/routes/module-fixer/review`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix issues in a module.
   *
   * @tags utils, dbtn/module:module_fixer
   * @name module_fixer_fix_module
   * @summary Module Fixer Fix Module
   * @request POST:/routes/module-fixer/fix
   */
  module_fixer_fix_module = (data: ModuleFixRequest, params: RequestParams = {}) =>
    this.request<ModuleFixerFixModuleData, ModuleFixerFixModuleError>({
      path: `/routes/module-fixer/fix`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check all modules for issues.
   *
   * @tags utils, dbtn/module:module_fixer
   * @name module_fixer_check_all_modules
   * @summary Module Fixer Check All Modules
   * @request POST:/routes/module-fixer/check-all
   */
  module_fixer_check_all_modules = (params: RequestParams = {}) =>
    this.request<ModuleFixerCheckAllModulesData, any>({
      path: `/routes/module-fixer/check-all`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix issues in all modules.
   *
   * @tags utils, dbtn/module:module_fixer
   * @name module_fixer_fix_all_modules
   * @summary Module Fixer Fix All Modules
   * @request POST:/routes/module-fixer/fix-all
   */
  module_fixer_fix_all_modules = (params: RequestParams = {}) =>
    this.request<ModuleFixerFixAllModulesData, any>({
      path: `/routes/module-fixer/fix-all`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix unterminated string literals in a Python module. Args: module_path: The path to the Python module to fix Returns: dict: Results of the fix operation
   *
   * @tags string-fixer, dbtn/module:string_fixer2
   * @name string_fixer2_fix_string_literals
   * @summary String Fixer2 Fix String Literals
   * @request POST:/routes/string-fixer2/fix-string-literals
   */
  string_fixer2_fix_string_literals = (data: StringFixer2FixStringLiteralsPayload, params: RequestParams = {}) =>
    this.request<StringFixer2FixStringLiteralsData, StringFixer2FixStringLiteralsError>({
      path: `/routes/string-fixer2/fix-string-literals`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix unterminated string literals in all modules with such errors. Returns: dict: Results of the fix operations
   *
   * @tags string-fixer, dbtn/module:string_fixer2
   * @name string_fixer2_fix_all_modules
   * @summary String Fixer2 Fix All Modules
   * @request POST:/routes/string-fixer2/fix-all-modules
   */
  string_fixer2_fix_all_modules = (params: RequestParams = {}) =>
    this.request<StringFixer2FixAllModulesData, void>({
      path: `/routes/string-fixer2/fix-all-modules`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check if a module has syntax errors. Args: module: The name of the module to check Returns: dict: Results of the check
   *
   * @tags string-fixer, dbtn/module:string_fixer2
   * @name string_fixer2_check_module
   * @summary String Fixer2 Check Module
   * @request GET:/routes/string-fixer2/check-module
   */
  string_fixer2_check_module = (query: StringFixer2CheckModuleParams, params: RequestParams = {}) =>
    this.request<StringFixer2CheckModuleData, StringFixer2CheckModuleError>({
      path: `/routes/string-fixer2/check-module`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Check all modules for syntax errors. Returns: dict: Results of the checks
   *
   * @tags string-fixer, dbtn/module:string_fixer2
   * @name string_fixer2_check_all_modules
   * @summary String Fixer2 Check All Modules
   * @request GET:/routes/string-fixer2/check-all-modules
   */
  string_fixer2_check_all_modules = (params: RequestParams = {}) =>
    this.request<StringFixer2CheckAllModulesData, void>({
      path: `/routes/string-fixer2/check-all-modules`,
      method: "GET",
      ...params,
    });

  /**
   * @description Review code for issues and optionally fix them. This endpoint uses OpenAI to analyze code for issues and optionally suggest fixes. Args: request: Review request with code and options
   *
   * @tags utils, dbtn/module:review_code
   * @name review_code
   * @summary Review Code Review Code
   * @request POST:/routes/review-code/review
   */
  review_code = (data: ReviewCodeRequest, params: RequestParams = {}) =>
    this.request<ReviewCodeData, ReviewCodeError>({
      path: `/routes/review-code/review`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Alternative code review endpoint for compatibility. This endpoint is the same as /review but with a different URL for backward compatibility. Args: request: Review request with code and options
   *
   * @tags utils, dbtn/module:review_code
   * @name review_code2
   * @summary Review Code Review Code2
   * @request POST:/routes/review-code/review2
   */
  review_code2 = (data: ReviewCodeRequest, params: RequestParams = {}) =>
    this.request<ReviewCode2Data, ReviewCode2Error>({
      path: `/routes/review-code/review2`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check the health of all API modules.
   *
   * @tags health, dbtn/module:health_check
   * @name check_diagnostics
   * @summary Health Check Diagnostics
   * @request GET:/routes/health-check/diagnostics
   */
  check_diagnostics = (params: RequestParams = {}) =>
    this.request<CheckDiagnosticsData, any>({
      path: `/routes/health-check/diagnostics`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fix issues in a specific file or module
   *
   * @tags code-fixer-v3, dbtn/module:code_fixer_v3
   * @name code_fixer_v3_enhanced_fix_module
   * @summary Code Fixer V3 Enhanced Fix Module
   * @request POST:/routes/fix_module
   */
  code_fixer_v3_enhanced_fix_module = (data: AppApisCodeFixerV3FixRequest, params: RequestParams = {}) =>
    this.request<CodeFixerV3EnhancedFixModuleData, CodeFixerV3EnhancedFixModuleError>({
      path: `/routes/fix_module`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix issues in all modules
   *
   * @tags code-fixer-v3, dbtn/module:code_fixer_v3
   * @name code_fixer_v3_enhanced_fix_all_modules
   * @summary Code Fixer V3 Enhanced Fix All Modules
   * @request POST:/routes/fix_all_modules
   */
  code_fixer_v3_enhanced_fix_all_modules = (params: RequestParams = {}) =>
    this.request<CodeFixerV3EnhancedFixAllModulesData, any>({
      path: `/routes/fix_all_modules`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check a specific file for issues without fixing
   *
   * @tags code-fixer-v3, dbtn/module:code_fixer_v3
   * @name code_fixer_v3_enhanced_check_module
   * @summary Code Fixer V3 Enhanced Check Module
   * @request GET:/routes/check_module
   */
  code_fixer_v3_enhanced_check_module = (query: CodeFixerV3EnhancedCheckModuleParams, params: RequestParams = {}) =>
    this.request<CodeFixerV3EnhancedCheckModuleData, CodeFixerV3EnhancedCheckModuleError>({
      path: `/routes/check_module`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Check all modules for issues without fixing
   *
   * @tags code-fixer-v3, dbtn/module:code_fixer_v3
   * @name code_fixer_v3_enhanced_check_all_modules
   * @summary Code Fixer V3 Enhanced Check All Modules
   * @request GET:/routes/check_all_modules
   */
  code_fixer_v3_enhanced_check_all_modules = (params: RequestParams = {}) =>
    this.request<CodeFixerV3EnhancedCheckAllModulesData, any>({
      path: `/routes/check_all_modules`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fix issues in the Home page (App.tsx)
   *
   * @tags code-fixer-v3, dbtn/module:code_fixer_v3
   * @name code_fixer_v3_enhanced_fix_home_page
   * @summary Code Fixer V3 Enhanced Fix Home Page
   * @request POST:/routes/fix_home_page
   */
  code_fixer_v3_enhanced_fix_home_page = (params: RequestParams = {}) =>
    this.request<CodeFixerV3EnhancedFixHomePageData, any>({
      path: `/routes/fix_home_page`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix issues in the PropertyListing component
   *
   * @tags code-fixer-v3, dbtn/module:code_fixer_v3
   * @name code_fixer_v3_enhanced_fix_property_listing_page
   * @summary Code Fixer V3 Enhanced Fix Property Listing Page
   * @request POST:/routes/fix_property_listing_page
   */
  code_fixer_v3_enhanced_fix_property_listing_page = (params: RequestParams = {}) =>
    this.request<CodeFixerV3EnhancedFixPropertyListingPageData, any>({
      path: `/routes/fix_property_listing_page`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix select components with null/undefined values in the Admin.tsx file.
   *
   * @tags code-fixer-v3, dbtn/module:code_fixer_v3
   * @name code_fixer_v3_enhanced_fix_admin_selects
   * @summary Code Fixer V3 Enhanced Fix Admin Selects
   * @request POST:/routes/fix-admin-selects
   */
  code_fixer_v3_enhanced_fix_admin_selects = (params: RequestParams = {}) =>
    this.request<CodeFixerV3EnhancedFixAdminSelectsData, any>({
      path: `/routes/fix-admin-selects`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix select components with null/undefined values in the PropertyEdit.tsx file.
   *
   * @tags code-fixer-v3, dbtn/module:code_fixer_v3
   * @name code_fixer_v3_enhanced_fix_property_edit_selects
   * @summary Code Fixer V3 Fix Property Edit Selects
   * @request POST:/routes/fix-property-edit-selects
   */
  code_fixer_v3_enhanced_fix_property_edit_selects = (params: RequestParams = {}) =>
    this.request<CodeFixerV3EnhancedFixPropertyEditSelectsData, any>({
      path: `/routes/fix-property-edit-selects`,
      method: "POST",
      ...params,
    });

  /**
   * No description
   *
   * @tags chat, dbtn/module:chat
   * @name chat_chat
   * @summary Chat Chat
   * @request POST:/routes/chat/
   */
  chat_chat = (data: ChatRequest, params: RequestParams = {}) =>
    this.request<ChatChatData, ChatChatError>({
      path: `/routes/chat/`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Chat with the MCP system
   *
   * @tags mcp, dbtn/module:model_context_protocol
   * @name mcp_chat
   * @summary Mcp Chat
   * @request POST:/routes/mcp/chat
   */
  mcp_chat = (data: AppApisModelContextProtocolMCPChatRequest, params: RequestParams = {}) =>
    this.request<McpChatData, McpChatError>({
      path: `/routes/mcp/chat`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Test the MCP system
   *
   * @tags mcp, dbtn/module:model_context_protocol
   * @name test_mcp
   * @summary Test Mcp
   * @request GET:/routes/mcp/test
   */
  test_mcp = (params: RequestParams = {}) =>
    this.request<TestMcpData, any>({
      path: `/routes/mcp/test`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test all health check endpoints
   *
   * @tags utils, dbtn/module:health_check_tester
   * @name check_all_health_endpoints
   * @summary Health Check Tester Check All Health Endpoints
   * @request GET:/routes/health-tester/check-all
   */
  check_all_health_endpoints = (params: RequestParams = {}) =>
    this.request<CheckAllHealthEndpointsData, any>({
      path: `/routes/health-tester/check-all`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test a specific health check endpoint
   *
   * @tags utils, dbtn/module:health_check_tester
   * @name check_health_endpoint
   * @summary Health Check Tester Check Health Endpoint
   * @request GET:/routes/health-tester/check/{module_name}
   */
  check_health_endpoint = ({ moduleName, ...query }: CheckHealthEndpointParams, params: RequestParams = {}) =>
    this.request<CheckHealthEndpointData, CheckHealthEndpointError>({
      path: `/routes/health-tester/check/${moduleName}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get information about the app
   *
   * @tags dbtn/module:app_analyzer
   * @name app_analyzer_get_app_analyzer_info
   * @summary Get App Analyzer Info
   * @request GET:/routes/get_app_info
   */
  app_analyzer_get_app_analyzer_info = (params: RequestParams = {}) =>
    this.request<AppAnalyzerGetAppAnalyzerInfoData, any>({
      path: `/routes/get_app_info`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get app settings
   *
   * @tags dbtn/module:app_analyzer
   * @name app_analyzer_get_settings
   * @summary App Analyzer Get Settings
   * @request GET:/routes/get_settings
   */
  app_analyzer_get_settings = (params: RequestParams = {}) =>
    this.request<AppAnalyzerGetSettingsData, any>({
      path: `/routes/get_settings`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check API consistency
   *
   * @tags dbtn/module:app_analyzer
   * @name app_analyzer_check_api_consistency
   * @summary App Analyzer Check Api Consistency
   * @request GET:/routes/check_api_consistency
   */
  app_analyzer_check_api_consistency = (params: RequestParams = {}) =>
    this.request<AppAnalyzerCheckApiConsistencyData, any>({
      path: `/routes/check_api_consistency`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check API consistency (version 2)
   *
   * @tags dbtn/module:app_analyzer
   * @name app_analyzer_check_api_consistency2
   * @summary Check Api Consistency2
   * @request GET:/routes/check_api_consistency2
   */
  app_analyzer_check_api_consistency2 = (params: RequestParams = {}) =>
    this.request<AppAnalyzerCheckApiConsistency2Data, any>({
      path: `/routes/check_api_consistency2`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check health of all endpoints
   *
   * @tags dbtn/module:app_analyzer
   * @name app_analyzer_check_health
   * @summary App Analyzer Check Health Endpoint
   * @request GET:/routes/check_health_endpoint
   */
  app_analyzer_check_health = (params: RequestParams = {}) =>
    this.request<AppAnalyzerCheckHealthData, any>({
      path: `/routes/check_health_endpoint`,
      method: "GET",
      ...params,
    });

  /**
   * @description Check health of all endpoints
   *
   * @tags dbtn/module:app_analyzer
   * @name app_analyzer_check_all_health
   * @summary App Analyzer Check All Health Endpoints
   * @request GET:/routes/check_all_health_endpoints
   */
  app_analyzer_check_all_health = (params: RequestParams = {}) =>
    this.request<AppAnalyzerCheckAllHealthData, any>({
      path: `/routes/check_all_health_endpoints`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fix a single module's dependency issues.
   *
   * @tags module-repair, dbtn/module:module_dependency_repair
   * @name module_dependency_repair_fix_module_api
   * @summary Module Dependency Repair Fix Module Api
   * @request POST:/routes/fix-module
   */
  module_dependency_repair_fix_module_api = (data: ModuleRequest, params: RequestParams = {}) =>
    this.request<ModuleDependencyRepairFixModuleApiData, ModuleDependencyRepairFixModuleApiError>({
      path: `/routes/fix-module`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix dependency issues for all specified modules or all target modules if none specified.
   *
   * @tags module-repair, dbtn/module:module_dependency_repair
   * @name module_dependency_repair_fix_all_modules_api
   * @summary Module Dependency Repair Fix All Modules Api
   * @request POST:/routes/fix-all-modules
   */
  module_dependency_repair_fix_all_modules_api = (
    data: AppApisModuleDependencyRepairFixAllRequest,
    params: RequestParams = {},
  ) =>
    this.request<ModuleDependencyRepairFixAllModulesApiData, ModuleDependencyRepairFixAllModulesApiError>({
      path: `/routes/fix-all-modules`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all modules that can be fixed and their current import status.
   *
   * @tags module-repair, dbtn/module:module_dependency_repair
   * @name list_modules
   * @summary List Modules
   * @request GET:/routes/modules
   */
  list_modules = (params: RequestParams = {}) =>
    this.request<ListModulesData, any>({
      path: `/routes/modules`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fix issues in a specific file or module
   *
   * @tags code-fixer-v2, dbtn/module:code_fixer_v2
   * @name code_fixer_v2_enhanced_fix_module
   * @summary Code Fixer V2 Legacy Fix Module
   * @request POST:/routes/v2/fix_module
   */
  code_fixer_v2_enhanced_fix_module = (data: AppApisCodeFixerV2FixRequest, params: RequestParams = {}) =>
    this.request<CodeFixerV2EnhancedFixModuleData, CodeFixerV2EnhancedFixModuleError>({
      path: `/routes/v2/fix_module`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix issues in all modules
   *
   * @tags code-fixer-v2, dbtn/module:code_fixer_v2
   * @name code_fixer_v2_enhanced_fix_all_modules
   * @summary Code Fixer V2 Legacy Fix All Modules
   * @request POST:/routes/v2/fix_all_modules
   */
  code_fixer_v2_enhanced_fix_all_modules = (params: RequestParams = {}) =>
    this.request<CodeFixerV2EnhancedFixAllModulesData, any>({
      path: `/routes/v2/fix_all_modules`,
      method: "POST",
      ...params,
    });

  /**
   * @description Check a specific file for issues without fixing
   *
   * @tags code-fixer-v2, dbtn/module:code_fixer_v2
   * @name code_fixer_v2_enhanced_check_module
   * @summary Code Fixer V2 Legacy Check Module
   * @request GET:/routes/v2/check_module
   */
  code_fixer_v2_enhanced_check_module = (query: CodeFixerV2EnhancedCheckModuleParams, params: RequestParams = {}) =>
    this.request<CodeFixerV2EnhancedCheckModuleData, CodeFixerV2EnhancedCheckModuleError>({
      path: `/routes/v2/check_module`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Check all modules for issues without fixing
   *
   * @tags code-fixer-v2, dbtn/module:code_fixer_v2
   * @name code_fixer_v2_enhanced_check_all_modules
   * @summary Code Fixer V2 Legacy Check All Modules
   * @request GET:/routes/v2/check_all_modules
   */
  code_fixer_v2_enhanced_check_all_modules = (params: RequestParams = {}) =>
    this.request<CodeFixerV2EnhancedCheckAllModulesData, any>({
      path: `/routes/v2/check_all_modules`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fix issues in the Home page (App.tsx)
   *
   * @tags code-fixer-v2, dbtn/module:code_fixer_v2
   * @name code_fixer_v2_enhanced_fix_home_page
   * @summary Code Fixer V2 Legacy Fix Home Page
   * @request POST:/routes/v2/fix_home_page
   */
  code_fixer_v2_enhanced_fix_home_page = (params: RequestParams = {}) =>
    this.request<CodeFixerV2EnhancedFixHomePageData, any>({
      path: `/routes/v2/fix_home_page`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix issues in the PropertyListing component
   *
   * @tags code-fixer-v2, dbtn/module:code_fixer_v2
   * @name code_fixer_v2_enhanced_fix_property_listing_page
   * @summary Code Fixer V2 Legacy Fix Property Listing Page
   * @request POST:/routes/v2/fix_property_listing_page
   */
  code_fixer_v2_enhanced_fix_property_listing_page = (params: RequestParams = {}) =>
    this.request<CodeFixerV2EnhancedFixPropertyListingPageData, any>({
      path: `/routes/v2/fix_property_listing_page`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix select components with null/undefined values in the Admin.tsx file.
   *
   * @tags code-fixer-v2, dbtn/module:code_fixer_v2
   * @name code_fixer_v2_enhanced_fix_admin_selects
   * @summary Code Fixer V2 Legacy Fix Admin Selects
   * @request POST:/routes/v2/fix-admin-selects
   */
  code_fixer_v2_enhanced_fix_admin_selects = (params: RequestParams = {}) =>
    this.request<CodeFixerV2EnhancedFixAdminSelectsData, any>({
      path: `/routes/v2/fix-admin-selects`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix select components with null/undefined values in the PropertyEdit.tsx file.
   *
   * @tags code-fixer-v2, dbtn/module:code_fixer_v2
   * @name code_fixer_v2_enhanced_fix_property_edit_selects
   * @summary Code Fixer V2 Legacy Fix Property Edit Selects
   * @request POST:/routes/v2/fix-property-edit-selects
   */
  code_fixer_v2_enhanced_fix_property_edit_selects = (params: RequestParams = {}) =>
    this.request<CodeFixerV2EnhancedFixPropertyEditSelectsData, any>({
      path: `/routes/v2/fix-property-edit-selects`,
      method: "POST",
      ...params,
    });

  /**
   * @description Generate a luxury concierge avatar image
   *
   * @tags concierge, dbtn/module:concierge_avatar
   * @name concierge_generate_avatar
   * @summary Concierge Generate Avatar
   * @request POST:/routes/concierge-avatar/generate
   */
  concierge_generate_avatar = (data: AvatarGenerationRequest, params: RequestParams = {}) =>
    this.request<ConciergeGenerateAvatarData, ConciergeGenerateAvatarError>({
      path: `/routes/concierge-avatar/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all available avatar poses
   *
   * @tags concierge, dbtn/module:concierge_avatar
   * @name get_avatar_poses
   * @summary Get Avatar Poses
   * @request GET:/routes/concierge-avatar/poses
   */
  get_avatar_poses = (params: RequestParams = {}) =>
    this.request<GetAvatarPosesData, any>({
      path: `/routes/concierge-avatar/poses`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test avatar generation with default parameters
   *
   * @tags concierge, dbtn/module:concierge_avatar
   * @name test_generation
   * @summary Test Generation
   * @request GET:/routes/concierge-avatar/test
   */
  test_generation = (params: RequestParams = {}) =>
    this.request<TestGenerationData, any>({
      path: `/routes/concierge-avatar/test`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate an image using DALL-E 3.
   *
   * @tags dbtn/module:dalle_generator
   * @name generate_dalle_image
   * @summary Generate Dalle Image
   * @request POST:/routes/dalle/generate
   */
  generate_dalle_image = (data: DalleRequest, params: RequestParams = {}) =>
    this.request<GenerateDalleImageData, GenerateDalleImageError>({
      path: `/routes/dalle/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get all available property locations Returns a list of locations available for creating or filtering properties. Each location includes a name, description, region, and country.
   *
   * @tags locations, dbtn/module:locations
   * @name get_locations
   * @summary Locations Get Locations
   * @request GET:/routes/locations-api
   */
  get_locations = (params: RequestParams = {}) =>
    this.request<GetLocationsData, any>({
      path: `/routes/locations-api`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a specific location by name Returns details for a specific location identified by its name.
   *
   * @tags locations, dbtn/module:locations
   * @name get_location_by_name
   * @summary Locations Get Location By Name
   * @request GET:/routes/locations-api/{location_name}
   */
  get_location_by_name = ({ locationName, ...query }: GetLocationByNameParams, params: RequestParams = {}) =>
    this.request<GetLocationByNameData, GetLocationByNameError>({
      path: `/routes/locations-api/${locationName}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Upload media files with metadata and folder organization
   *
   * @tags dbtn/module:enhanced_media_management
   * @name upload_media4
   * @summary Upload Media4
   * @request POST:/routes/enhanced-media-management/upload
   */
  upload_media4 = (data: BodyUploadMedia4, params: RequestParams = {}) =>
    this.request<UploadMedia4Data, UploadMedia4Error>({
      path: `/routes/enhanced-media-management/upload`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Upload a base64 encoded image with metadata and folder organization
   *
   * @tags dbtn/module:enhanced_media_management
   * @name upload_base64_image3
   * @summary Enhanced Media Management Upload Base64 Image
   * @request POST:/routes/enhanced-media-management/upload-base64
   */
  upload_base64_image3 = (data: AppApisEnhancedMediaManagementBase64UploadRequest, params: RequestParams = {}) =>
    this.request<UploadBase64Image3Data, UploadBase64Image3Error>({
      path: `/routes/enhanced-media-management/upload-base64`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a folder in Supabase storage
   *
   * @tags dbtn/module:enhanced_media_management
   * @name create_folder
   * @summary Create Folder
   * @request POST:/routes/enhanced-media-management/create-folder
   */
  create_folder = (data: BodyCreateFolder, params: RequestParams = {}) =>
    this.request<CreateFolderData, CreateFolderError>({
      path: `/routes/enhanced-media-management/create-folder`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List media files with advanced filtering and folder support
   *
   * @tags dbtn/module:enhanced_media_management
   * @name list_media4
   * @summary Enhanced Media Management List Media
   * @request GET:/routes/enhanced-media-management/list
   */
  list_media4 = (query: ListMedia4Params, params: RequestParams = {}) =>
    this.request<ListMedia4Data, ListMedia4Error>({
      path: `/routes/enhanced-media-management/list`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Delete multiple media files in a single operation
   *
   * @tags dbtn/module:enhanced_media_management
   * @name batch_delete_media
   * @summary Batch Delete Media
   * @request POST:/routes/enhanced-media-management/batch-delete
   */
  batch_delete_media = (data: BodyBatchDeleteMedia, params: RequestParams = {}) =>
    this.request<BatchDeleteMediaData, BatchDeleteMediaError>({
      path: `/routes/enhanced-media-management/batch-delete`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update metadata for an existing file
   *
   * @tags dbtn/module:enhanced_media_management
   * @name update_metadata
   * @summary Update Metadata
   * @request PUT:/routes/enhanced-media-management/update-metadata/{file_id}
   */
  update_metadata = (
    { fileId, ...query }: UpdateMetadataParams,
    data: UpdateMetadataPayload,
    params: RequestParams = {},
  ) =>
    this.request<UpdateMetadataData, UpdateMetadataError>({
      path: `/routes/enhanced-media-management/update-metadata/${fileId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Move media files to a different folder
   *
   * @tags dbtn/module:enhanced_media_management
   * @name move_media
   * @summary Move Media
   * @request POST:/routes/enhanced-media-management/move
   */
  move_media = (data: BodyMoveMedia, params: RequestParams = {}) =>
    this.request<MoveMediaData, MoveMediaError>({
      path: `/routes/enhanced-media-management/move`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check health of the enhanced media management API and Supabase connection
   *
   * @tags dbtn/module:enhanced_media_management
   * @name check_health2
   * @summary Check health of enhanced media management API
   * @request GET:/routes/enhanced-media-management/health
   */
  check_health2 = (params: RequestParams = {}) =>
    this.request<CheckHealth2Data, any>({
      path: `/routes/enhanced-media-management/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate text using DeepSeek AI
   *
   * @tags deepseek, dbtn/module:deepseek_wrapper
   * @name deepseek_wrapper_text_generation
   * @summary Text Generation
   * @request POST:/routes/deepseek/text-generation
   */
  deepseek_wrapper_text_generation = (data: AppApisDeepseekWrapperTextGenerationRequest, params: RequestParams = {}) =>
    this.request<DeepseekWrapperTextGenerationData, DeepseekWrapperTextGenerationError>({
      path: `/routes/deepseek/text-generation`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate properties using DeepSeek or OpenAI
   *
   * @tags deepseek, dbtn/module:deepseek_wrapper
   * @name deepseek_wrapper_generate_property
   * @summary Deepseek Wrapper Generate Property
   * @request POST:/routes/deepseek/generate-property
   */
  deepseek_wrapper_generate_property = (data: PropertyGenerationRequest, params: RequestParams = {}) =>
    this.request<DeepseekWrapperGeneratePropertyData, DeepseekWrapperGeneratePropertyError>({
      path: `/routes/deepseek/generate-property`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate an optimized prompt for AI text generation
   *
   * @tags deepseek, dbtn/module:deepseek_wrapper
   * @name deepseek_wrapper_generate_prompt
   * @summary Generate Prompt Endpoint
   * @request POST:/routes/deepseek/generate-prompt
   */
  deepseek_wrapper_generate_prompt = (query: DeepseekWrapperGeneratePromptParams, params: RequestParams = {}) =>
    this.request<DeepseekWrapperGeneratePromptData, DeepseekWrapperGeneratePromptError>({
      path: `/routes/deepseek/generate-prompt`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Generate a detailed luxury property description
   *
   * @tags properties, dbtn/module:description_generator
   * @name description_generator_generate_description
   * @summary Description Generator Generate Description
   * @request POST:/routes/descriptions/generate
   */
  description_generator_generate_description = (
    data: AppApisDescriptionGeneratorGenerateDescriptionRequest,
    params: RequestParams = {},
  ) =>
    this.request<DescriptionGeneratorGenerateDescriptionData, DescriptionGeneratorGenerateDescriptionError>({
      path: `/routes/descriptions/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Save a version of property description to history
   *
   * @tags properties, dbtn/module:description_generator
   * @name description_generator_save_version
   * @summary Description Generator Save Version
   * @request POST:/routes/descriptions/save-version
   */
  description_generator_save_version = (
    data: AppApisDescriptionGeneratorSaveVersionRequest,
    params: RequestParams = {},
  ) =>
    this.request<DescriptionGeneratorSaveVersionData, DescriptionGeneratorSaveVersionError>({
      path: `/routes/descriptions/save-version`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get version history for a property
   *
   * @tags properties, dbtn/module:description_generator
   * @name description_generator_get_versions
   * @summary Description Generator Get Versions
   * @request POST:/routes/descriptions/get-versions
   */
  description_generator_get_versions = (data: GetVersionsRequest, params: RequestParams = {}) =>
    this.request<DescriptionGeneratorGetVersionsData, DescriptionGeneratorGetVersionsError>({
      path: `/routes/descriptions/get-versions`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate luxury properties and hero images for home page This endpoint generates a set of luxury properties and hero images for the home page. It can optionally include hero images for the carousel.
   *
   * @tags dbtn/module:generate_luxury_properties2
   * @name generate_luxury_vista_properties2
   * @summary Generate Properties Endpoint
   * @request POST:/routes/luxury-properties-home/generate
   */
  generate_luxury_vista_properties2 = (data: GenerateLuxuryPropertiesRequest, params: RequestParams = {}) =>
    this.request<GenerateLuxuryVistaProperties2Data, GenerateLuxuryVistaProperties2Error>({
      path: `/routes/luxury-properties-home/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the status of the property generation This endpoint returns the status of the property generation, including the number of properties and hero images generated.
   *
   * @tags dbtn/module:generate_luxury_properties2
   * @name get_generation_status2
   * @summary Generate Luxury Properties2 Get Generation Status
   * @request GET:/routes/luxury-properties-home/status
   */
  get_generation_status2 = (params: RequestParams = {}) =>
    this.request<GetGenerationStatus2Data, any>({
      path: `/routes/luxury-properties-home/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Upload media files
   *
   * @tags dbtn/module:media
   * @name upload_media_basic
   * @summary Upload Media Basic
   * @request POST:/routes/upload
   */
  upload_media_basic = (data: BodyUploadMediaBasic, params: RequestParams = {}) =>
    this.request<UploadMediaBasicData, UploadMediaBasicError>({
      path: `/routes/upload`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description List all media files
   *
   * @tags dbtn/module:media
   * @name media_list_media
   * @summary Media List Media
   * @request GET:/routes/list
   */
  media_list_media = (params: RequestParams = {}) =>
    this.request<MediaListMediaData, any>({
      path: `/routes/list`,
      method: "GET",
      ...params,
    });

  /**
   * @description Delete a media file
   *
   * @tags dbtn/module:media
   * @name media_delete_media
   * @summary Media Delete Media
   * @request DELETE:/routes/{filename}
   */
  media_delete_media = ({ filename, ...query }: MediaDeleteMediaParams, params: RequestParams = {}) =>
    this.request<MediaDeleteMediaData, MediaDeleteMediaError>({
      path: `/routes/${filename}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Enhanced chat endpoint using Model Context Protocol (MCP) to provide specialized context
   *
   * @tags dbtn/module:mcp_chat
   * @name mcp_chat_endpoint
   * @summary Mcp Chat Endpoint
   * @request POST:/routes/mcp-chat/chat
   */
  mcp_chat_endpoint = (data: AppApisMcpChatMCPChatRequest, params: RequestParams = {}) =>
    this.request<McpChatEndpointData, McpChatEndpointError>({
      path: `/routes/mcp-chat/chat`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Test endpoint to verify MCP integration is working
   *
   * @tags dbtn/module:mcp_chat
   * @name mcp_chat_test_mcp
   * @summary Mcp Chat Test Mcp
   * @request GET:/routes/mcp-chat/test
   */
  mcp_chat_test_mcp = (params: RequestParams = {}) =>
    this.request<McpChatTestMcpData, any>({
      path: `/routes/mcp-chat/test`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate an avatar using MCP
   *
   * @tags concierge, dbtn/module:mcp_avatar
   * @name mcp_generate_avatar
   * @summary Mcp Generate Avatar
   * @request POST:/routes/mcp-avatar/generate
   */
  mcp_generate_avatar = (data: MCPAvatarRequest, params: RequestParams = {}) =>
    this.request<McpGenerateAvatarData, McpGenerateAvatarError>({
      path: `/routes/mcp-avatar/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Test MCP integration
   *
   * @tags concierge, dbtn/module:mcp_avatar
   * @name mcp_avatar_test_mcp
   * @summary Mcp Avatar Test Mcp
   * @request GET:/routes/mcp-avatar/test
   */
  mcp_avatar_test_mcp = (params: RequestParams = {}) =>
    this.request<McpAvatarTestMcpData, any>({
      path: `/routes/mcp-avatar/test`,
      method: "GET",
      ...params,
    });

  /**
   * @description Fix inconsistent property types in the database
   *
   * @tags dbtn/module:database_repair
   * @name fix_property_types
   * @summary Fix Property Types
   * @request POST:/routes/database-repair/fix-property-types
   */
  fix_property_types = (params: RequestParams = {}) =>
    this.request<FixPropertyTypesData, any>({
      path: `/routes/database-repair/fix-property-types`,
      method: "POST",
      ...params,
    });

  /**
   * @description Upload images for a specific property
   *
   * @tags dbtn/module:database_repair
   * @name upload_property_images
   * @summary Upload Property Images
   * @request POST:/routes/database-repair/upload-property-images
   */
  upload_property_images = (data: BodyUploadPropertyImages, params: RequestParams = {}) =>
    this.request<UploadPropertyImagesData, UploadPropertyImagesError>({
      path: `/routes/database-repair/upload-property-images`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Fix inconsistent field naming (snake_case vs camelCase)
   *
   * @tags dbtn/module:database_repair
   * @name normalize_field_names
   * @summary Normalize Field Names
   * @request POST:/routes/database-repair/normalize-field-names
   */
  normalize_field_names = (params: RequestParams = {}) =>
    this.request<NormalizeFieldNamesData, any>({
      path: `/routes/database-repair/normalize-field-names`,
      method: "POST",
      ...params,
    });

  /**
   * @description Create a property using the storage fallback system
   *
   * @tags property-storage-fallback, dbtn/module:property_storage_fallback
   * @name create_property_storage
   * @summary Create Property Storage
   * @request POST:/routes/property-storage-fallback/properties
   */
  create_property_storage = (data: CreatePropertyStoragePayload, params: RequestParams = {}) =>
    this.request<CreatePropertyStorageData, CreatePropertyStorageError>({
      path: `/routes/property-storage-fallback/properties`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get properties using the storage fallback system
   *
   * @tags property-storage-fallback, dbtn/module:property_storage_fallback
   * @name get_properties_storage
   * @summary Get Properties Storage
   * @request GET:/routes/property-storage-fallback/properties
   */
  get_properties_storage = (query: GetPropertiesStorageParams, params: RequestParams = {}) =>
    this.request<GetPropertiesStorageData, GetPropertiesStorageError>({
      path: `/routes/property-storage-fallback/properties`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a property by ID using the storage fallback system
   *
   * @tags property-storage-fallback, dbtn/module:property_storage_fallback
   * @name get_property_storage
   * @summary Get Property Storage
   * @request GET:/routes/property-storage-fallback/properties/{property_id}
   */
  get_property_storage = ({ propertyId, ...query }: GetPropertyStorageParams, params: RequestParams = {}) =>
    this.request<GetPropertyStorageData, GetPropertyStorageError>({
      path: `/routes/property-storage-fallback/properties/${propertyId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update a property using the storage fallback system
   *
   * @tags property-storage-fallback, dbtn/module:property_storage_fallback
   * @name update_property_storage
   * @summary Update Property Storage
   * @request PUT:/routes/property-storage-fallback/properties/{property_id}
   */
  update_property_storage = (
    { propertyId, ...query }: UpdatePropertyStorageParams,
    data: UpdatePropertyStoragePayload,
    params: RequestParams = {},
  ) =>
    this.request<UpdatePropertyStorageData, UpdatePropertyStorageError>({
      path: `/routes/property-storage-fallback/properties/${propertyId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a property using the storage fallback system
   *
   * @tags property-storage-fallback, dbtn/module:property_storage_fallback
   * @name delete_property_storage
   * @summary Delete Property Storage
   * @request DELETE:/routes/property-storage-fallback/properties/{property_id}
   */
  delete_property_storage = ({ propertyId, ...query }: DeletePropertyStorageParams, params: RequestParams = {}) =>
    this.request<DeletePropertyStorageData, DeletePropertyStorageError>({
      path: `/routes/property-storage-fallback/properties/${propertyId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Upload an image for a property using the storage fallback system
   *
   * @tags property-storage-fallback, dbtn/module:property_storage_fallback
   * @name upload_property_image_storage
   * @summary Upload Property Image Storage
   * @request POST:/routes/property-storage-fallback/properties/{property_id}/images
   */
  upload_property_image_storage = (
    { propertyId, ...query }: UploadPropertyImageStorageParams,
    params: RequestParams = {},
  ) =>
    this.request<UploadPropertyImageStorageData, UploadPropertyImageStorageError>({
      path: `/routes/property-storage-fallback/properties/${propertyId}/images`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get a list of properties using the facade pattern to avoid circular dependencies. Args: page: Page number (starts at 1) size: Number of items per page Returns: Response containing the list of properties
   *
   * @tags properties, dbtn/module:facade, properties, dbtn/module:property_facade
   * @name get_property_facade_list
   * @summary Get Properties Via Facade
   * @request GET:/routes/property-manager/properties-facade
   */
  get_property_facade_list = (query: GetPropertyFacadeListParams, params: RequestParams = {}) =>
    this.request<GetPropertyFacadeListData, GetPropertyFacadeListError>({
      path: `/routes/property-manager/properties-facade`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a single property by ID using the facade pattern. Args: property_id: ID of the property to retrieve Returns: Response containing the property data
   *
   * @tags properties, dbtn/module:facade, dbtn/module:property_facade
   * @name get_property_facade_by_id
   * @summary Get Property Via Facade
   * @request GET:/routes/property-manager/property-facade/{property_id}
   */
  get_property_facade_by_id = ({ propertyId, ...query }: GetPropertyFacadeByIdParams, params: RequestParams = {}) =>
    this.request<GetPropertyFacadeByIdData, GetPropertyFacadeByIdError>({
      path: `/routes/property-manager/property-facade/${propertyId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Search for properties using various criteria. Args: request: Search criteria Returns: Response containing matching properties
   *
   * @tags properties, dbtn/module:facade, dbtn/module:property_facade
   * @name search_properties_facade
   * @summary Property Facade Search Properties
   * @request POST:/routes/property-manager/search-facade
   */
  search_properties_facade = (data: AppApisSharedPropertySearchRequest, params: RequestParams = {}) =>
    this.request<SearchPropertiesFacadeData, SearchPropertiesFacadeError>({
      path: `/routes/property-manager/search-facade`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate properties using the facade pattern to avoid circular dependencies. This endpoint will delegate to the appropriate property generator implementation. Args: request: Configuration for property generation background_tasks: Background tasks runner for async operations Returns: Response containing generated properties
   *
   * @tags properties, dbtn/module:facade, dbtn/module:property_facade
   * @name generate_property_facade_endpoint
   * @summary Generate Properties Via Facade
   * @request POST:/routes/property-manager/generate-facade
   */
  generate_property_facade_endpoint = (data: GeneratePropertiesRequest, params: RequestParams = {}) =>
    this.request<GeneratePropertyFacadeEndpointData, GeneratePropertyFacadeEndpointError>({
      path: `/routes/property-manager/generate-facade`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate a property with AI content via facade
   *
   * @tags property-manager, dbtn/module:facade
   * @name generic_facade_generate_property_facade
   * @summary Generic Facade Generate Property Facade
   * @request POST:/routes/property-manager/generic/generate-facade
   */
  generic_facade_generate_property_facade = (
    query: GenericFacadeGeneratePropertyFacadeParams,
    params: RequestParams = {},
  ) =>
    this.request<GenericFacadeGeneratePropertyFacadeData, GenericFacadeGeneratePropertyFacadeError>({
      path: `/routes/property-manager/generic/generate-facade`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get properties with optional filtering via facade
   *
   * @tags property-manager, dbtn/module:facade
   * @name generic_facade_get_properties_facade
   * @summary Generic Facade Get Properties Facade
   * @request GET:/routes/property-manager/generic/properties-facade
   */
  generic_facade_get_properties_facade = (query: GenericFacadeGetPropertiesFacadeParams, params: RequestParams = {}) =>
    this.request<GenericFacadeGetPropertiesFacadeData, GenericFacadeGetPropertiesFacadeError>({
      path: `/routes/property-manager/generic/properties-facade`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a property by ID via facade
   *
   * @tags property-manager, dbtn/module:facade
   * @name generic_facade_get_property_facade
   * @summary Generic Facade Get Property Facade
   * @request GET:/routes/property-manager/generic/property-facade/{property_id}
   */
  generic_facade_get_property_facade = (
    { propertyId, ...query }: GenericFacadeGetPropertyFacadeParams,
    params: RequestParams = {},
  ) =>
    this.request<GenericFacadeGetPropertyFacadeData, GenericFacadeGetPropertyFacadeError>({
      path: `/routes/property-manager/generic/property-facade/${propertyId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate an authentication token for AI models
   *
   * @tags ai, mcp, dbtn/module:mcp
   * @name mcp_generate_token
   * @summary Generate Token
   * @request POST:/routes/mcp/auth/token
   */
  mcp_generate_token = (data: TokenRequest, params: RequestParams = {}) =>
    this.request<McpGenerateTokenData, McpGenerateTokenError>({
      path: `/routes/mcp/auth/token`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get recent MCP logs
   *
   * @tags ai, mcp, dbtn/module:mcp
   * @name mcp_get_logs
   * @summary Get Mcp Logs
   * @request GET:/routes/mcp/logs
   */
  mcp_get_logs = (query: McpGetLogsParams, params: RequestParams = {}) =>
    this.request<McpGetLogsData, McpGetLogsError>({
      path: `/routes/mcp/logs`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get MCP usage statistics
   *
   * @tags ai, mcp, dbtn/module:mcp
   * @name mcp_get_log_stats
   * @summary Get Mcp Log Stats
   * @request GET:/routes/mcp/logs/stats
   */
  mcp_get_log_stats = (query: McpGetLogStatsParams, params: RequestParams = {}) =>
    this.request<McpGetLogStatsData, McpGetLogStatsError>({
      path: `/routes/mcp/logs/stats`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Run a single MCP test
   *
   * @tags ai, mcp, dbtn/module:mcp
   * @name mcp_run_test
   * @summary Run Mcp Test
   * @request POST:/routes/mcp/test/run
   */
  mcp_run_test = (query: McpRunTestParams, data: TestCase, params: RequestParams = {}) =>
    this.request<McpRunTestData, McpRunTestError>({
      path: `/routes/mcp/test/run`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Run a standard MCP test suite
   *
   * @tags ai, mcp, dbtn/module:mcp
   * @name mcp_run_test_suite
   * @summary Run Mcp Test Suite
   * @request POST:/routes/mcp/test/suite
   */
  mcp_run_test_suite = (query: McpRunTestSuiteParams, params: RequestParams = {}) =>
    this.request<McpRunTestSuiteData, McpRunTestSuiteError>({
      path: `/routes/mcp/test/suite`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Get MCP documentation Args: doc_type: Type of documentation to retrieve (overview, extension_guide, best_practices, example_requests) token: Optional authentication token
   *
   * @tags ai, mcp, dbtn/module:mcp
   * @name mcp_get_docs
   * @summary Get Mcp Docs
   * @request GET:/routes/mcp/docs
   */
  mcp_get_docs = (query: McpGetDocsParams, params: RequestParams = {}) =>
    this.request<McpGetDocsData, McpGetDocsError>({
      path: `/routes/mcp/docs`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Health check endpoint for the MCP server
   *
   * @tags ai, mcp, dbtn/module:mcp
   * @name mcp_health_check
   * @summary Mcp Health Check
   * @request GET:/routes/mcp/health
   */
  mcp_health_check = (params: RequestParams = {}) =>
    this.request<McpHealthCheckData, any>({
      path: `/routes/mcp/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all leads with optional filtering
   *
   * @tags crm, dbtn/module:crm_integration
   * @name crm_get_leads
   * @summary Crm Get Leads
   * @request GET:/routes/crm/leads
   */
  crm_get_leads = (query: CrmGetLeadsParams, params: RequestParams = {}) =>
    this.request<CrmGetLeadsData, CrmGetLeadsError>({
      path: `/routes/crm/leads`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get conversations with optional filtering
   *
   * @tags crm, dbtn/module:crm_integration
   * @name crm_get_conversations
   * @summary Crm Get Conversations
   * @request GET:/routes/crm/conversations
   */
  crm_get_conversations = (query: CrmGetConversationsParams, params: RequestParams = {}) =>
    this.request<CrmGetConversationsData, CrmGetConversationsError>({
      path: `/routes/crm/conversations`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Check health of CRM integration
   *
   * @tags crm, dbtn/module:crm_integration
   * @name crm_integration_health_check
   * @summary Crm Integration Health Check
   * @request GET:/routes/crm/health
   */
  crm_integration_health_check = (params: RequestParams = {}) =>
    this.request<CrmIntegrationHealthCheckData, any>({
      path: `/routes/crm/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Sync properties to external CRM system
   *
   * @tags crm, dbtn/module:crm_integration
   * @name sync_properties_to_crm
   * @summary Sync Properties To Crm
   * @request POST:/routes/crm/sync-properties
   */
  sync_properties_to_crm = (params: RequestParams = {}) =>
    this.request<SyncPropertiesToCrmData, any>({
      path: `/routes/crm/sync-properties`,
      method: "POST",
      ...params,
    });

  /**
   * @description Sync leads to external CRM system
   *
   * @tags crm, dbtn/module:crm_integration
   * @name sync_leads_to_crm
   * @summary Sync Leads To Crm
   * @request POST:/routes/crm/sync-leads
   */
  sync_leads_to_crm = (params: RequestParams = {}) =>
    this.request<SyncLeadsToCrmData, any>({
      path: `/routes/crm/sync-leads`,
      method: "POST",
      ...params,
    });

  /**
   * @description Chat with the concierge Args: request: Chat request Returns: Chat response
   *
   * @tags concierge, dbtn/module:concierge
   * @name chat
   * @summary Chat
   * @request POST:/routes/concierge/chat
   */
  chat = (data: ConciergeChatRequest, params: RequestParams = {}) =>
    this.request<ChatData, ChatError>({
      path: `/routes/concierge/chat`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Chat with the concierge with streaming response Args: request: Chat request Returns: Streaming response
   *
   * @tags concierge, stream, dbtn/module:concierge
   * @name chat_stream
   * @summary Chat Stream
   * @request POST:/routes/concierge/chat/stream
   */
  chat_stream = (data: ConciergeChatRequest, params: RequestParams = {}) =>
    this.requestStream<ChatStreamData, ChatStreamError>({
      path: `/routes/concierge/chat/stream`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get concierge settings Returns: Concierge settings
   *
   * @tags concierge, dbtn/module:concierge
   * @name get_concierge_settings
   * @summary Get Concierge Settings
   * @request GET:/routes/concierge/settings
   */
  get_concierge_settings = (params: RequestParams = {}) =>
    this.request<GetConciergeSettingsData, any>({
      path: `/routes/concierge/settings`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update concierge settings Args: settings: New settings Returns: Updated settings
   *
   * @tags concierge, dbtn/module:concierge
   * @name update_concierge_settings
   * @summary Update Concierge Settings
   * @request PUT:/routes/concierge/settings
   */
  update_concierge_settings = (data: ConciergeSettings, params: RequestParams = {}) =>
    this.request<UpdateConciergeSettingsData, UpdateConciergeSettingsError>({
      path: `/routes/concierge/settings`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get leads captured by the concierge Args: limit: Maximum number of leads to return Returns: List of leads
   *
   * @tags concierge, dbtn/module:concierge
   * @name concierge_get_leads
   * @summary Concierge Get Leads
   * @request GET:/routes/concierge/leads
   */
  concierge_get_leads = (query: ConciergeGetLeadsParams, params: RequestParams = {}) =>
    this.request<ConciergeGetLeadsData, ConciergeGetLeadsError>({
      path: `/routes/concierge/leads`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get conversations with the concierge Args: limit: Maximum number of conversations to return Returns: List of conversations
   *
   * @tags concierge, dbtn/module:concierge
   * @name concierge_get_conversations
   * @summary Concierge Get Conversations
   * @request GET:/routes/concierge/conversations
   */
  concierge_get_conversations = (query: ConciergeGetConversationsParams, params: RequestParams = {}) =>
    this.request<ConciergeGetConversationsData, ConciergeGetConversationsError>({
      path: `/routes/concierge/conversations`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Health check endpoint Returns: Health status
   *
   * @tags concierge, dbtn/module:concierge
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/concierge/health
   */
  health_check = (params: RequestParams = {}) =>
    this.request<HealthCheckData, any>({
      path: `/routes/concierge/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get a comprehensive analytics dashboard for the follow-up system with key metrics This endpoint provides a complete overview of follow-up system performance including: - Response and conversion rates by follow-up type - Time-based metrics (average response time, conversion time) - Follow-up effectiveness by lead temperature - Trend analysis for different metrics
   *
   * @tags follow-up-dashboard, dbtn/module:follow_up_dashboard
   * @name follow_up_dashboard_get_analytics_dashboard
   * @summary Follow Up Dashboard Get Analytics Dashboard
   * @request POST:/routes/follow-up-dashboard/analytics-summary
   */
  follow_up_dashboard_get_analytics_dashboard = (data: DashboardRequest, params: RequestParams = {}) =>
    this.request<FollowUpDashboardGetAnalyticsDashboardData, FollowUpDashboardGetAnalyticsDashboardError>({
      path: `/routes/follow-up-dashboard/analytics-summary`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get time series data for various follow-up metrics Provides daily or weekly data points for metrics like: - Follow-ups sent - Responses received - Conversions - Response rates over time
   *
   * @tags follow-up-dashboard, dbtn/module:follow_up_dashboard
   * @name follow_up_dashboard_get_time_series_metrics
   * @summary Follow Up Dashboard Get Time Series Metrics
   * @request POST:/routes/follow-up-dashboard/time-series
   */
  follow_up_dashboard_get_time_series_metrics = (data: TimeSeriesMetricsRequest, params: RequestParams = {}) =>
    this.request<FollowUpDashboardGetTimeSeriesMetricsData, FollowUpDashboardGetTimeSeriesMetricsError>({
      path: `/routes/follow-up-dashboard/time-series`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get top performing leads based on follow-up engagement metrics Identifies leads with the highest engagement rates, fastest response times, or most successful conversion paths to help prioritize high-value prospects.
   *
   * @tags follow-up-dashboard, dbtn/module:follow_up_dashboard
   * @name follow_up_dashboard_get_top_performing_leads
   * @summary Follow Up Dashboard Get Top Performing Leads
   * @request POST:/routes/follow-up-dashboard/top-performing-leads
   */
  follow_up_dashboard_get_top_performing_leads = (data: LeadPerformanceRequest, params: RequestParams = {}) =>
    this.request<FollowUpDashboardGetTopPerformingLeadsData, FollowUpDashboardGetTopPerformingLeadsError>({
      path: `/routes/follow-up-dashboard/top-performing-leads`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Upload media files to Supabase storage
   *
   * @tags dbtn/module:media_management_v2
   * @name upload_media2
   * @summary Upload media files to Supabase storage
   * @request POST:/routes/media-management-v2/upload
   */
  upload_media2 = (data: BodyUploadMedia2, params: RequestParams = {}) =>
    this.request<UploadMedia2Data, UploadMedia2Error>({
      path: `/routes/media-management-v2/upload`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Upload media files from URLs to Supabase storage
   *
   * @tags dbtn/module:media_management_v2
   * @name media_management_v2_upload_from_url
   * @summary Upload media files from URLs to Supabase storage
   * @request POST:/routes/media-management-v2/upload-from-url
   */
  media_management_v2_upload_from_url = (data: UploadURLRequest, params: RequestParams = {}) =>
    this.request<MediaManagementV2UploadFromUrlData, MediaManagementV2UploadFromUrlError>({
      path: `/routes/media-management-v2/upload-from-url`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Start migrating Ideogram images to Supabase in the background
   *
   * @tags dbtn/module:media_management_v2
   * @name media_management_v2_migrate_ideogram_images
   * @summary Start migrating Ideogram images to Supabase in the background
   * @request POST:/routes/media-management-v2/migrate-ideogram-images
   */
  media_management_v2_migrate_ideogram_images = (params: RequestParams = {}) =>
    this.request<MediaManagementV2MigrateIdeogramImagesData, any>({
      path: `/routes/media-management-v2/migrate-ideogram-images`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get the status of the most recent media migration
   *
   * @tags dbtn/module:media_management_v2
   * @name media_management_v2_get_migration_status
   * @summary Get the status of the most recent media migration
   * @request GET:/routes/media-management-v2/migration-status
   */
  media_management_v2_get_migration_status = (params: RequestParams = {}) =>
    this.request<MediaManagementV2GetMigrationStatusData, any>({
      path: `/routes/media-management-v2/migration-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Upload a base64 encoded image to Supabase storage
   *
   * @tags dbtn/module:media_management_v2
   * @name media_management_v2_upload_base64_image
   * @summary Upload base64 encoded image to Supabase storage
   * @request POST:/routes/media-management-v2/upload-base64
   */
  media_management_v2_upload_base64_image = (
    data: AppApisMediaManagementV2Base64UploadRequest,
    params: RequestParams = {},
  ) =>
    this.request<MediaManagementV2UploadBase64ImageData, MediaManagementV2UploadBase64ImageError>({
      path: `/routes/media-management-v2/upload-base64`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Advanced search for media files in Supabase storage by filename with sorting and filtering
   *
   * @tags dbtn/module:media_management_v2
   * @name media_management_v2_search_media
   * @summary Search for media files in Supabase storage
   * @request GET:/routes/media-management-v2/search
   */
  media_management_v2_search_media = (query: MediaManagementV2SearchMediaParams, params: RequestParams = {}) =>
    this.request<MediaManagementV2SearchMediaData, MediaManagementV2SearchMediaError>({
      path: `/routes/media-management-v2/search`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description List media files in Supabase storage
   *
   * @tags dbtn/module:media_management_v2
   * @name media_management_v2_list_media
   * @summary List media files in Supabase storage
   * @request GET:/routes/media-management-v2/list
   */
  media_management_v2_list_media = (query: MediaManagementV2ListMediaParams, params: RequestParams = {}) =>
    this.request<MediaManagementV2ListMediaData, MediaManagementV2ListMediaError>({
      path: `/routes/media-management-v2/list`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Delete a media file from Supabase storage
   *
   * @tags dbtn/module:media_management_v2
   * @name media_management_v2_delete_media
   * @summary Delete a media file from Supabase storage
   * @request DELETE:/routes/media-management-v2/delete/{bucket}/{path}
   */
  media_management_v2_delete_media = (
    { bucket, path, ...query }: MediaManagementV2DeleteMediaParams,
    params: RequestParams = {},
  ) =>
    this.request<MediaManagementV2DeleteMediaData, MediaManagementV2DeleteMediaError>({
      path: `/routes/media-management-v2/delete/${bucket}/${path}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Check health of the media management API and Supabase connection
   *
   * @tags dbtn/module:media_management_v2
   * @name check_health22
   * @summary Check health of media management API
   * @request GET:/routes/media-management-v2/health
   * @originalName check_health2
   * @duplicate
   */
  check_health22 = (params: RequestParams = {}) =>
    this.request<CheckHealth22Data, any>({
      path: `/routes/media-management-v2/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the status of the most recent media migration
   *
   * @tags dbtn/module:media_migration
   * @name media_migration_get_migration_status
   * @summary Media Migration Get Migration Status
   * @request GET:/routes/media-migration/migration-status
   */
  media_migration_get_migration_status = (params: RequestParams = {}) =>
    this.request<MediaMigrationGetMigrationStatusData, any>({
      path: `/routes/media-migration/migration-status`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:media_migration
   * @name media_migration_migrate_ideogram_images
   * @summary Media Migration Migrate Ideogram Images
   * @request POST:/routes/media-migration/migrate-ideogram-images
   */
  media_migration_migrate_ideogram_images = (params: RequestParams = {}) =>
    this.request<MediaMigrationMigrateIdeogramImagesData, any>({
      path: `/routes/media-migration/migrate-ideogram-images`,
      method: "POST",
      ...params,
    });

  /**
   * @description Generate luxury properties with high-quality Ideogram AI images This endpoint will generate luxury properties for the LuxuryVista platform with photorealistic Ideogram AI-generated images.
   *
   * @tags dbtn/module:property_generator_api
   * @name generate_luxury_vista_properties22
   * @summary Property Generator Api Generate Luxury Vista Properties
   * @request POST:/routes/luxury-properties-generator/generate
   * @originalName generate_luxury_vista_properties2
   * @duplicate
   */
  generate_luxury_vista_properties22 = (data: GenPropertiesRequest, params: RequestParams = {}) =>
    this.request<GenerateLuxuryVistaProperties22Data, GenerateLuxuryVistaProperties22Error>({
      path: `/routes/luxury-properties-generator/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the status of property generation This endpoint retrieves the current status of luxury property generation.
   *
   * @tags dbtn/module:property_generator_api
   * @name get_generation_status22
   * @summary Property Generator Api Get Generation Status
   * @request GET:/routes/luxury-properties-generator/status
   * @originalName get_generation_status2
   * @duplicate
   */
  get_generation_status22 = (params: RequestParams = {}) =>
    this.request<GetGenerationStatus22Data, any>({
      path: `/routes/luxury-properties-generator/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new property with fallback storage
   *
   * @tags dbtn/module:property_fallback
   * @name property_fallback_create
   * @summary Create Property Fallback
   * @request POST:/routes/property-fallback/create
   */
  property_fallback_create = (data: PropertyFallbackCreatePayload, params: RequestParams = {}) =>
    this.request<PropertyFallbackCreateData, PropertyFallbackCreateError>({
      path: `/routes/property-fallback/create`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get properties with optional filtering
   *
   * @tags dbtn/module:property_fallback
   * @name property_fallback_get_list
   * @summary Get Properties Fallback
   * @request GET:/routes/property-fallback/properties
   */
  property_fallback_get_list = (query: PropertyFallbackGetListParams, params: RequestParams = {}) =>
    this.request<PropertyFallbackGetListData, PropertyFallbackGetListError>({
      path: `/routes/property-fallback/properties`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get a property by ID
   *
   * @tags dbtn/module:property_fallback
   * @name property_fallback_get_by_id
   * @summary Get Property Fallback
   * @request GET:/routes/property-fallback/property/{property_id}
   */
  property_fallback_get_by_id = ({ propertyId, ...query }: PropertyFallbackGetByIdParams, params: RequestParams = {}) =>
    this.request<PropertyFallbackGetByIdData, PropertyFallbackGetByIdError>({
      path: `/routes/property-fallback/property/${propertyId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update a property
   *
   * @tags dbtn/module:property_fallback
   * @name property_fallback_update
   * @summary Update Property Fallback
   * @request PUT:/routes/property-fallback/property/{property_id}
   */
  property_fallback_update = (
    { propertyId, ...query }: PropertyFallbackUpdateParams,
    data: PropertyUpdateRequest,
    params: RequestParams = {},
  ) =>
    this.request<PropertyFallbackUpdateData, PropertyFallbackUpdateError>({
      path: `/routes/property-fallback/property/${propertyId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a property
   *
   * @tags dbtn/module:property_fallback
   * @name property_fallback_delete
   * @summary Delete Property Fallback
   * @request DELETE:/routes/property-fallback/property/{property_id}
   */
  property_fallback_delete = ({ propertyId, ...query }: PropertyFallbackDeleteParams, params: RequestParams = {}) =>
    this.request<PropertyFallbackDeleteData, PropertyFallbackDeleteError>({
      path: `/routes/property-fallback/property/${propertyId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Upload an image for a property
   *
   * @tags dbtn/module:property_fallback
   * @name property_fallback_upload_image
   * @summary Upload Property Image Fallback
   * @request POST:/routes/property-fallback/property/{property_id}/upload-image
   */
  property_fallback_upload_image = (
    { propertyId, ...query }: PropertyFallbackUploadImageParams,
    data: BodyPropertyFallbackUploadImage,
    params: RequestParams = {},
  ) =>
    this.request<PropertyFallbackUploadImageData, PropertyFallbackUploadImageError>({
      path: `/routes/property-fallback/property/${propertyId}/upload-image`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Generate properties with AI content
   *
   * @tags dbtn/module:property_fallback
   * @name property_fallback_generate_properties
   * @summary Property Fallback Generate Properties
   * @request POST:/routes/property-fallback/generate
   */
  property_fallback_generate_properties = (data: GeneratePropertiesRequest, params: RequestParams = {}) =>
    this.request<PropertyFallbackGeneratePropertiesData, PropertyFallbackGeneratePropertiesError>({
      path: `/routes/property-fallback/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate luxury properties with Ideogram AI images This endpoint generates high-quality luxury property listings with photorealistic images created using Ideogram AI.
   *
   * @tags properties, dbtn/module:property_generator
   * @name generate_luxury_vista_properties
   * @summary Property Generator Generate Luxury Vista Properties
   * @request POST:/routes/property-generator/luxury-vista-properties
   */
  generate_luxury_vista_properties = (data: GenerateLuxuryVistaPropertiesPayload, params: RequestParams = {}) =>
    this.request<GenerateLuxuryVistaPropertiesData, GenerateLuxuryVistaPropertiesError>({
      path: `/routes/property-generator/luxury-vista-properties`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the status of property generation This endpoint returns the current status of property generation, including the number of properties generated and their IDs.
   *
   * @tags properties, dbtn/module:property_generator
   * @name get_generation_status
   * @summary Property Generator Get Generation Status
   * @request GET:/routes/property-generator/generation-status
   */
  get_generation_status = (params: RequestParams = {}) =>
    this.request<GetGenerationStatusData, any>({
      path: `/routes/property-generator/generation-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate luxury properties in Brasília. This endpoint will generate new luxury properties with detailed descriptions, investment metrics, and features. Each property includes placeholders for images. Args: request: Configuration for property generation
   *
   * @tags properties, dbtn/module:property_generator
   * @name property_generator_generate_properties
   * @summary Property Generator Generate Properties
   * @request POST:/routes/property-generator/generate-properties
   */
  property_generator_generate_properties = (data: GeneratePropertiesRequest, params: RequestParams = {}) =>
    this.request<PropertyGeneratorGeneratePropertiesData, PropertyGeneratorGeneratePropertiesError>({
      path: `/routes/property-generator/generate-properties`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if Weaviate connection is healthy
   *
   * @tags weaviate, dbtn/module:weaviate_client
   * @name weaviate_client_health_check
   * @summary Weaviate Client Health Check
   * @request GET:/routes/weaviate/health
   */
  weaviate_client_health_check = (params: RequestParams = {}) =>
    this.request<WeaviateClientHealthCheckData, any>({
      path: `/routes/weaviate/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Initialize Weaviate schema for the LuxuryVista application
   *
   * @tags weaviate, dbtn/module:weaviate_client
   * @name initialize_schema
   * @summary Initialize Schema
   * @request POST:/routes/weaviate/init-schema
   */
  initialize_schema = (params: RequestParams = {}) =>
    this.request<InitializeSchemaData, any>({
      path: `/routes/weaviate/init-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Import properties from storage into Weaviate
   *
   * @tags weaviate, dbtn/module:weaviate_client
   * @name import_properties
   * @summary Import Properties
   * @request POST:/routes/weaviate/import-properties
   */
  import_properties = (params: RequestParams = {}) =>
    this.request<ImportPropertiesData, any>({
      path: `/routes/weaviate/import-properties`,
      method: "POST",
      ...params,
    });

  /**
   * @description Search properties using vector similarity
   *
   * @tags weaviate, dbtn/module:weaviate_client
   * @name weaviate_client_search_properties
   * @summary Weaviate Client Search Properties
   * @request POST:/routes/weaviate/search
   */
  weaviate_client_search_properties = (data: VectorSearchRequest, params: RequestParams = {}) =>
    this.request<WeaviateClientSearchPropertiesData, WeaviateClientSearchPropertiesError>({
      path: `/routes/weaviate/search`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Natural language search for properties
   *
   * @tags weaviate, dbtn/module:weaviate_client
   * @name natural_language_search
   * @summary Natural Language Search
   * @request POST:/routes/weaviate/nl-search
   */
  natural_language_search = (data: BodyNaturalLanguageSearch, params: RequestParams = {}) =>
    this.request<NaturalLanguageSearchData, NaturalLanguageSearchError>({
      path: `/routes/weaviate/nl-search`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get a property by its ID from Weaviate
   *
   * @tags weaviate, dbtn/module:weaviate_client
   * @name weaviate_client_get_property_by_id
   * @summary Weaviate Client Get Property By Id
   * @request GET:/routes/weaviate/get-property/{property_id}
   */
  weaviate_client_get_property_by_id = (
    { propertyId, ...query }: WeaviateClientGetPropertyByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<WeaviateClientGetPropertyByIdData, WeaviateClientGetPropertyByIdError>({
      path: `/routes/weaviate/get-property/${propertyId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Schedule a follow-up for a specific lead based on their temperature and engagement history
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name schedule_follow_up_endpoint
   * @summary Schedule Follow Up Endpoint
   * @request POST:/routes/follow-up/schedule
   */
  schedule_follow_up_endpoint = (data: ScheduleFollowUpRequest, params: RequestParams = {}) =>
    this.request<ScheduleFollowUpEndpointData, ScheduleFollowUpEndpointError>({
      path: `/routes/follow-up/schedule`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Trigger a follow-up for a lead immediately or queue it for scheduled delivery
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name trigger_follow_up_endpoint
   * @summary Trigger Follow Up Endpoint
   * @request POST:/routes/follow-up/trigger
   */
  trigger_follow_up_endpoint = (data: TriggerFollowUpRequest, params: RequestParams = {}) =>
    this.request<TriggerFollowUpEndpointData, TriggerFollowUpEndpointError>({
      path: `/routes/follow-up/trigger`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get leads that are due for follow-up
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name get_leads_due_for_followup_endpoint
   * @summary Get Leads Due For Followup Endpoint
   * @request POST:/routes/follow-up/due
   */
  get_leads_due_for_followup_endpoint = (params: RequestParams = {}) =>
    this.request<GetLeadsDueForFollowupEndpointData, any>({
      path: `/routes/follow-up/due`,
      method: "POST",
      ...params,
    });

  /**
   * @description Identify leads that match specific targeting criteria for follow-up campaigns
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name target_leads_for_followup
   * @summary Target Leads For Followup
   * @request POST:/routes/follow-up/target
   */
  target_leads_for_followup = (data: LeadTargetingRequest, params: RequestParams = {}) =>
    this.request<TargetLeadsForFollowupData, TargetLeadsForFollowupError>({
      path: `/routes/follow-up/target`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Identify groups of leads for bulk follow-up campaigns based on sophisticated criteria
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name bulk_targeting_for_campaigns
   * @summary Bulk Targeting For Campaigns
   * @request POST:/routes/follow-up/bulk-targeting
   */
  bulk_targeting_for_campaigns = (data: BulkTargetingRequest, params: RequestParams = {}) =>
    this.request<BulkTargetingForCampaignsData, BulkTargetingForCampaignsError>({
      path: `/routes/follow-up/bulk-targeting`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Prepare conversation resumption with preserved context from previous interactions
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name resume_conversation_with_context
   * @summary Resume Conversation With Context
   * @request POST:/routes/follow-up/resume-conversation
   */
  resume_conversation_with_context = (query: ResumeConversationWithContextParams, params: RequestParams = {}) =>
    this.request<ResumeConversationWithContextData, ResumeConversationWithContextError>({
      path: `/routes/follow-up/resume-conversation`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Generate a re-engagement campaign for leads that have been inactive for a specified period
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name generate_reengagement_campaign
   * @summary Generate Reengagement Campaign
   * @request POST:/routes/follow-up/re-engagement
   */
  generate_reengagement_campaign = (query: GenerateReengagementCampaignParams, params: RequestParams = {}) =>
    this.request<GenerateReengagementCampaignData, GenerateReengagementCampaignError>({
      path: `/routes/follow-up/re-engagement`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Mark a lead as handed off to human agent and update their sales funnel
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name handle_lead_handoff
   * @summary Handle Lead Handoff
   * @request POST:/routes/follow-up/handoff
   */
  handle_lead_handoff = (query: HandleLeadHandoffParams, params: RequestParams = {}) =>
    this.request<HandleLeadHandoffData, HandleLeadHandoffError>({
      path: `/routes/follow-up/handoff`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Schedule follow-ups for multiple leads at once to efficiently manage lead nurturing sequences
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name batch_schedule_follow_ups
   * @summary Batch Schedule Follow Ups
   * @request POST:/routes/follow-up/batch-schedule
   */
  batch_schedule_follow_ups = (data: BatchScheduleFollowUpsRequest, params: RequestParams = {}) =>
    this.request<BatchScheduleFollowUpsData, BatchScheduleFollowUpsError>({
      path: `/routes/follow-up/batch-schedule`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Create a new follow-up campaign with targeting criteria and message template
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name create_campaign_endpoint
   * @summary Create Campaign Endpoint
   * @request POST:/routes/follow-up/campaigns/create
   */
  create_campaign_endpoint = (
    query: CreateCampaignEndpointParams,
    data: CreateCampaignEndpointPayload,
    params: RequestParams = {},
  ) =>
    this.request<CreateCampaignEndpointData, CreateCampaignEndpointError>({
      path: `/routes/follow-up/campaigns/create`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get list of leads matching a campaign's targeting criteria
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name get_campaign_targets_endpoint
   * @summary Get Campaign Targets Endpoint
   * @request POST:/routes/follow-up/campaigns/targets
   */
  get_campaign_targets_endpoint = (query: GetCampaignTargetsEndpointParams, params: RequestParams = {}) =>
    this.request<GetCampaignTargetsEndpointData, GetCampaignTargetsEndpointError>({
      path: `/routes/follow-up/campaigns/targets`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Execute a follow-up campaign by scheduling messages for all matching leads
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name execute_campaign_endpoint
   * @summary Execute Campaign Endpoint
   * @request POST:/routes/follow-up/campaigns/execute
   */
  execute_campaign_endpoint = (query: ExecuteCampaignEndpointParams, params: RequestParams = {}) =>
    this.request<ExecuteCampaignEndpointData, ExecuteCampaignEndpointError>({
      path: `/routes/follow-up/campaigns/execute`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Track a lead's response to a campaign message
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name track_campaign_response_endpoint
   * @summary Track Campaign Response Endpoint
   * @request POST:/routes/follow-up/campaigns/track-response
   */
  track_campaign_response_endpoint = (query: TrackCampaignResponseEndpointParams, params: RequestParams = {}) =>
    this.request<TrackCampaignResponseEndpointData, TrackCampaignResponseEndpointError>({
      path: `/routes/follow-up/campaigns/track-response`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description List all follow-up campaigns, optionally filtered by status
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name list_campaigns_endpoint
   * @summary List Campaigns Endpoint
   * @request GET:/routes/follow-up/campaigns/list
   */
  list_campaigns_endpoint = (query: ListCampaignsEndpointParams, params: RequestParams = {}) =>
    this.request<ListCampaignsEndpointData, ListCampaignsEndpointError>({
      path: `/routes/follow-up/campaigns/list`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get detailed analytics for a specific campaign
   *
   * @tags follow-up, dbtn/module:follow_up
   * @name get_campaign_analytics_endpoint
   * @summary Get Campaign Analytics Endpoint
   * @request GET:/routes/follow-up/campaigns/analytics/{campaign_id}
   */
  get_campaign_analytics_endpoint = (
    { campaignId, ...query }: GetCampaignAnalyticsEndpointParams,
    params: RequestParams = {},
  ) =>
    this.request<GetCampaignAnalyticsEndpointData, GetCampaignAnalyticsEndpointError>({
      path: `/routes/follow-up/campaigns/analytics/${campaignId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Upload media file to Supabase Storage
   *
   * @tags media, dbtn/module:media_management
   * @name upload_media
   * @summary Upload Media
   * @request POST:/routes/media/upload
   */
  upload_media = (data: BodyUploadMedia, params: RequestParams = {}) =>
    this.request<UploadMediaData, UploadMediaError>({
      path: `/routes/media/upload`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Upload media from URL to Supabase Storage
   *
   * @tags media, dbtn/module:media_management
   * @name upload_from_url
   * @summary Upload From Url
   * @request POST:/routes/media/upload-from-url
   */
  upload_from_url = (data: BodyUploadFromUrl, params: RequestParams = {}) =>
    this.request<UploadFromUrlData, UploadFromUrlError>({
      path: `/routes/media/upload-from-url`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });

  /**
   * @description Upload base64 encoded image to Supabase Storage
   *
   * @tags media, dbtn/module:media_management
   * @name upload_base64_image
   * @summary Upload Base64 Image
   * @request POST:/routes/media/upload-base64
   */
  upload_base64_image = (data: BodyUploadBase64Image, params: RequestParams = {}) =>
    this.request<UploadBase64ImageData, UploadBase64ImageError>({
      path: `/routes/media/upload-base64`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });

  /**
   * @description List media files
   *
   * @tags media, dbtn/module:media_management
   * @name list_media
   * @summary List Media
   * @request GET:/routes/media/list
   */
  list_media = (query: ListMediaParams, params: RequestParams = {}) =>
    this.request<ListMediaData, ListMediaError>({
      path: `/routes/media/list`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Search media files
   *
   * @tags media, dbtn/module:media_management
   * @name search_media
   * @summary Search Media
   * @request POST:/routes/media/search
   */
  search_media = (data: SearchMediaRequest, params: RequestParams = {}) =>
    this.request<SearchMediaData, SearchMediaError>({
      path: `/routes/media/search`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete media file from Supabase Storage
   *
   * @tags media, dbtn/module:media_management
   * @name delete_media
   * @summary Delete Media
   * @request DELETE:/routes/media/{media_id}
   */
  delete_media = ({ mediaId, ...query }: DeleteMediaParams, params: RequestParams = {}) =>
    this.request<DeleteMediaData, DeleteMediaError>({
      path: `/routes/media/${mediaId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get status of Ideogram images migration
   *
   * @tags media, dbtn/module:media_management
   * @name get_migration_status
   * @summary Get Migration Status
   * @request GET:/routes/media/migration-status
   */
  get_migration_status = (params: RequestParams = {}) =>
    this.request<GetMigrationStatusData, any>({
      path: `/routes/media/migration-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Search for properties with advanced filtering options.
   *
   * @tags property-search, dbtn/module:property_search
   * @name property_search_search
   * @summary Property Search Search Properties
   * @request POST:/routes/property-search/search
   */
  property_search_search = (data: PropertySearchFilters, params: RequestParams = {}) =>
    this.request<PropertySearchSearchData, PropertySearchSearchError>({
      path: `/routes/property-search/search`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Search properties using natural language query
   *
   * @tags property-search, dbtn/module:property_search
   * @name property_search_nl_search
   * @summary Search Properties2
   * @request POST:/routes/property-search/property-search
   */
  property_search_nl_search = (data: AppApisPropertySearchPropertySearchRequest, params: RequestParams = {}) =>
    this.request<PropertySearchNlSearchData, PropertySearchNlSearchError>({
      path: `/routes/property-search/property-search`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Health check endpoint for the property service.
   *
   * @tags properties, system, dbtn/module:property_service
   * @name property_service_health_check
   * @summary Property Service Health Check
   * @request GET:/routes/properties/system/health
   */
  property_service_health_check = (params: RequestParams = {}) =>
    this.request<PropertyServiceHealthCheckData, any>({
      path: `/routes/properties/system/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description List properties with filtering and pagination.
   *
   * @tags properties, dbtn/module:property_service
   * @name list_properties
   * @summary List Properties
   * @request GET:/routes/properties/
   */
  list_properties = (query: ListPropertiesParams, params: RequestParams = {}) =>
    this.request<ListPropertiesData, ListPropertiesError>({
      path: `/routes/properties/`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create a new property.
   *
   * @tags properties, dbtn/module:property_service
   * @name create_property
   * @summary Property Service Create Property
   * @request POST:/routes/properties/
   */
  create_property = (data: PropertyCreate, params: RequestParams = {}) =>
    this.request<CreatePropertyData, CreatePropertyError>({
      path: `/routes/properties/`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get a property by ID.
   *
   * @tags properties, dbtn/module:property_service
   * @name get_property2
   * @summary Property Service Get Property
   * @request GET:/routes/properties/{property_id}
   * @originalName get_property
   * @duplicate
   */
  get_property2 = ({ propertyId, ...query }: GetProperty2Params, params: RequestParams = {}) =>
    this.request<GetProperty2Data, GetProperty2Error>({
      path: `/routes/properties/${propertyId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update a property.
   *
   * @tags properties, dbtn/module:property_service
   * @name update_property
   * @summary Property Service Update Property
   * @request PATCH:/routes/properties/{property_id}
   */
  update_property = (
    { propertyId, ...query }: UpdatePropertyParams,
    data: PropertyUpdate,
    params: RequestParams = {},
  ) =>
    this.request<UpdatePropertyData, UpdatePropertyError>({
      path: `/routes/properties/${propertyId}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a property.
   *
   * @tags properties, dbtn/module:property_service
   * @name delete_property
   * @summary Property Service Delete Property
   * @request DELETE:/routes/properties/{property_id}
   */
  delete_property = ({ propertyId, ...query }: DeletePropertyParams, params: RequestParams = {}) =>
    this.request<DeletePropertyData, DeletePropertyError>({
      path: `/routes/properties/${propertyId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Upload an image for a property.
   *
   * @tags properties, dbtn/module:property_service
   * @name upload_property_image
   * @summary Property Service Upload Property Image
   * @request POST:/routes/properties/{property_id}/images
   */
  upload_property_image = (
    { propertyId, ...query }: UploadPropertyImageParams,
    data: BodyUploadPropertyImage,
    params: RequestParams = {},
  ) =>
    this.request<UploadPropertyImageData, UploadPropertyImageError>({
      path: `/routes/properties/${propertyId}/images`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Update all property images with DALL-E, respecting rate limits. Args: image_count: Number of images to generate per property (1-5) force_regenerate: Force regeneration of images even if they already exist
   *
   * @tags properties-maintenance, dbtn/module:properties
   * @name properties_update_all_images
   * @summary Update All Property Images
   * @request POST:/routes/properties-api/properties/update-all-images
   */
  properties_update_all_images = (query: PropertiesUpdateAllImagesParams, params: RequestParams = {}) =>
    this.request<PropertiesUpdateAllImagesData, PropertiesUpdateAllImagesError>({
      path: `/routes/properties-api/properties/update-all-images`,
      method: "POST",
      query: query,
      ...params,
    });

  /**
   * @description Initialize Supabase schema with required tables if they don't exist.
   *
   * @tags dbtn/module:schema_init
   * @name init_supabase_schema
   * @summary Init Supabase Schema
   * @request POST:/routes/init-schema
   */
  init_supabase_schema = (params: RequestParams = {}) =>
    this.request<InitSupabaseSchemaData, any>({
      path: `/routes/init-schema`,
      method: "POST",
      ...params,
    });

  /**
   * @description Migrate properties to Supabase
   *
   * @tags dbtn/module:schema_init
   * @name migrate_properties
   * @summary Migrate Properties
   * @request POST:/routes/migrate-properties
   */
  migrate_properties = (data: MigrationRequest, params: RequestParams = {}) =>
    this.request<MigratePropertiesData, MigratePropertiesError>({
      path: `/routes/migrate-properties`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Legacy endpoint for regenerating all properties. This endpoint forwards requests to the new property_generator module. It maintains backward compatibility with older code that uses this endpoint. Args: request: Legacy regeneration request background_tasks: For background processing
   *
   * @tags properties, dbtn/module:property_regenerator
   * @name regenerate_all_properties
   * @summary Regenerate All Properties Regenerator
   * @request POST:/routes/property-regenerator/regenerate-all-properties
   */
  regenerate_all_properties = (data: RegeneratePropertiesRequest, params: RequestParams = {}) =>
    this.request<RegenerateAllPropertiesData, RegenerateAllPropertiesError>({
      path: `/routes/property-regenerator/regenerate-all-properties`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate SEO-optimized title and subtitle suggestions for luxury properties. This endpoint produces high-quality title and subtitle combinations optimized for SEO performance in the luxury real estate market, with special focus on properties in Brasília. Args: request: Configuration for SEO suggestions
   *
   * @tags seo, dbtn/module:seo_enhancer
   * @name seo_title_subtitle_enhancer
   * @summary Seo Title Subtitle Enhancer
   * @request POST:/routes/seo-enhancer/title-subtitle
   */
  seo_title_subtitle_enhancer = (data: SeoTitleRequest, params: RequestParams = {}) =>
    this.request<SeoTitleSubtitleEnhancerData, SeoTitleSubtitleEnhancerError>({
      path: `/routes/seo-enhancer/title-subtitle`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix unterminated string literals in a specific module
   *
   * @tags dbtn/module:api_fixer
   * @name api_fixer_fix_string_literals
   * @summary Api Fixer Fix String Literals
   * @request POST:/routes/fix-strings
   */
  api_fixer_fix_string_literals = (data: FixModuleRequest, params: RequestParams = {}) =>
    this.request<ApiFixerFixStringLiteralsData, ApiFixerFixStringLiteralsError>({
      path: `/routes/fix-strings`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix unterminated string literals in all modules
   *
   * @tags dbtn/module:api_fixer
   * @name api_fixer_fix_all_string_literals
   * @summary Api Fixer Fix All String Literals
   * @request POST:/routes/fix-all-strings
   */
  api_fixer_fix_all_string_literals = (data: AppApisApiFixerFixAllRequest, params: RequestParams = {}) =>
    this.request<ApiFixerFixAllStringLiteralsData, ApiFixerFixAllStringLiteralsError>({
      path: `/routes/fix-all-strings`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix router issues in a specific API module
   *
   * @tags dbtn/module:api_fixer
   * @name fix_module_router
   * @summary Fix Module Router
   * @request POST:/routes/fix-router
   */
  fix_module_router = (data: FixModuleRequest, params: RequestParams = {}) =>
    this.request<FixModuleRouterData, FixModuleRouterError>({
      path: `/routes/fix-router`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix router issues in all API modules
   *
   * @tags dbtn/module:api_fixer
   * @name fix_all_module_routers
   * @summary Fix All Module Routers
   * @request POST:/routes/fix-all-routers
   */
  fix_all_module_routers = (data: AppApisApiFixerFixAllRequest, params: RequestParams = {}) =>
    this.request<FixAllModuleRoutersData, FixAllModuleRoutersError>({
      path: `/routes/fix-all-routers`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check API module consistency across the app
   *
   * @tags dbtn/module:api_fixer
   * @name api_fixer_check_api_consistency
   * @summary Api Fixer Check Api Consistency
   * @request POST:/routes/consistency-check
   */
  api_fixer_check_api_consistency = (params: RequestParams = {}) =>
    this.request<ApiFixerCheckApiConsistencyData, any>({
      path: `/routes/consistency-check`,
      method: "POST",
      ...params,
    });

  /**
   * @description Fix syntax issues in a specific API module
   *
   * @tags dbtn/module:api_fixer
   * @name api_fixer_fix_module_syntax
   * @summary Api Fixer Fix Module Syntax
   * @request POST:/routes/api-fixer/fix-module
   */
  api_fixer_fix_module_syntax = (data: FixModuleRequest, params: RequestParams = {}) =>
    this.request<ApiFixerFixModuleSyntaxData, ApiFixerFixModuleSyntaxError>({
      path: `/routes/api-fixer/fix-module`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix syntax issues in all API modules
   *
   * @tags dbtn/module:api_fixer
   * @name api_fixer_fix_all_modules_syntax
   * @summary Api Fixer Fix All Modules Syntax
   * @request POST:/routes/api-fixer/fix-all-modules
   */
  api_fixer_fix_all_modules_syntax = (data: AppApisApiFixerFixAllRequest, params: RequestParams = {}) =>
    this.request<ApiFixerFixAllModulesSyntaxData, ApiFixerFixAllModulesSyntaxError>({
      path: `/routes/api-fixer/fix-all-modules`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fix missing operation_ids in router decorators
   *
   * @tags dbtn/module:api_fixer
   * @name fix_operation_ids
   * @summary Fix Operation Ids
   * @request POST:/routes/operation-id-fixer-scan
   */
  fix_operation_ids = (params: RequestParams = {}) =>
    this.request<FixOperationIdsData, any>({
      path: `/routes/operation-id-fixer-scan`,
      method: "POST",
      ...params,
    });

  /**
   * @description Generate one or more properties using AI
   *
   * @tags dbtn/module:property_manager
   * @name generate_property_endpoint
   * @summary Generate Property Endpoint
   * @request POST:/routes/generate-property
   */
  generate_property_endpoint = (data: GeneratePropertiesRequest, params: RequestParams = {}) =>
    this.request<GeneratePropertyEndpointData, GeneratePropertyEndpointError>({
      path: `/routes/generate-property`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Call an MCP method
   *
   * @tags mcp, dbtn/module:api
   * @name mcp_call_method
   * @summary Call Method
   * @request POST:/routes/mcp/rpc
   */
  mcp_call_method = (query: McpCallMethodParams, data: MCPRequest, params: RequestParams = {}) =>
    this.request<McpCallMethodData, McpCallMethodError>({
      path: `/routes/mcp/rpc`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
