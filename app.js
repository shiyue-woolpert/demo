require([
    "esri/layers/BuildingSceneLayer",
    "esri/layers/SceneLayer",
    "esri/layers/IntegratedMeshLayer",
    "esri/layers/PointCloudLayer",
    "esri/layers/GroupLayer",
    "esri/core/Collection",
    "esri/support/actions/ActionButton"
], function (
    BuildingSceneLayer,
    SceneLayer,
    IntegratedMeshLayer,
    PointCloudLayer,
    GroupLayer,
    Collection,
    ActionButton
) {

    async function initScene() {
        const viewElement = document.getElementById("scene");

        await viewElement.viewOnReady();

        const map = viewElement.map;
        const view = viewElement.view;

        const layerList = document.querySelector("arcgis-layer-list");
        const layerListExpand = document.getElementById("layerListExpand");

        const buildingExplorer = document.getElementById("buildingExplorer");
        const buildingExplorerExpand = document.getElementById("buildingExplorerExpand");

        const buildingLayer = new BuildingSceneLayer({
            url: "https://enterprisedev.woolpert.com/server/rest/services/Hosted/36149_AAM_MB_ZZ_M3_G_0001_R2020_S3_P01/SceneServer",
            title: "BIM Model",
            visible: true,
            listMode: "hide-children"
        });

        const bimGroup = new GroupLayer({
            title: "BIM",
            visibilityMode: "independent",
            visible: true,
            layers: [buildingLayer]
        });

        const lod3Group = new GroupLayer({
            title: "LOD3",
            visibilityMode: "independent",
            visible: true,
            layers: [
                new SceneLayer({
                    title: "Brisbane LOD3 Textured",
                    url: "https://enterprisedev.woolpert.com/server/rest/services/Hosted/Brisbane_LOD3_Textured/SceneServer",
                    visible: false
                }),

                new SceneLayer({
                    title: "Brisbane LOD3 Untextured",
                    url: "https://enterprisedev.woolpert.com/server/rest/services/Hosted/Brisbane_LOD3_Untextured/SceneServer",
                    visible: false
                }),

                new SceneLayer({
                    title: "Melbourne LOD3 Textured",
                    url: "https://enterprisedev.woolpert.com/server/rest/services/Hosted/Melbourne_Textured_LOD3/SceneServer",
                    visible: false
                }),

                new SceneLayer({
                    title: "Melbourne Sporting Precinct LOD3 Untextured",
                    url: "https://enterprisedev.woolpert.com/server/rest/services/Hosted/Melbourne_SportingPrecinct_LOD3_Untextured_slpk/SceneServer",
                    visible: false
                }),

                new SceneLayer({
                    title: "South Melbourne LOD3 Updates",
                    url: "https://enterprisedev.woolpert.com/server/rest/services/Hosted/South_Melbourne_LOD3_Updates/SceneServer",
                    visible: false
                })
            ]
        });

        const lod2Group = new GroupLayer({
            title: "LOD2",
            visibilityMode: "independent",
            visible: true,
            layers: [
                new SceneLayer({
                    title: "Brisbane St Lucia LOD2 Textured",
                    url: "https://enterprisedev.woolpert.com/server/rest/services/Hosted/Brisbane_StLucia_LOD2/SceneServer",
                    visible: false
                })
            ]
        });

        const lod1Group = new GroupLayer({
            title: "LOD1",
            visibilityMode: "independent",
            visible: true,
            layers: [
                new SceneLayer({
                    title: "Macquarie Park LOD1 Untextured",
                    url: "https://enterprisedev.woolpert.com/server/rest/services/Hosted/MacquariePark_LOD1_Untextured/SceneServer",
                    visible: false
                })
            ]
        });

        const photomeshGroup = new GroupLayer({
            title: "Photomesh",
            visibilityMode: "independent",
            visible: true,
            layers: [
                new IntegratedMeshLayer({
                    title: "Geelong 3D Mesh 5cm",
                    url: "https://enterprisedev.woolpert.com/server/rest/services/Hosted/Geelong_3D_Mesh_7_5cm_2022/SceneServer",
                    visible: false
                }),

                new IntegratedMeshLayer({
                    title: "Sydney 3D Mesh 10cm",
                    url: "https://enterprisedev.woolpert.com/server/rest/services/Hosted/Sydney_3D_Mesh_10cm/SceneServer",
                    visible: false
                })
            ]
        });

        const pointCloudGroup = new GroupLayer({
            title: "Point Cloud",
            visibilityMode: "independent",
            visible: true,
            layers: [
                new PointCloudLayer({
                    title: "Melbourne Sample Classified Point Cloud",
                    url: "https://enterprisedev.woolpert.com/server/rest/services/Hosted/Melbourne_Sample_Classified_Point_Cloud_16Pts_m2/SceneServer",
                    visible: false
                })
            ]
        });
        const groupLayers = [
            bimGroup,
            pointCloudGroup,
            photomeshGroup,
            lod1Group,
            lod2Group,
            lod3Group
        ];
        map.addMany(groupLayers);

        const groupTitles = groupLayers.map(layer => layer.title);

        layerList.listItemCreatedFunction = (event) => {

            const item = event.item;

            item.open = true;

            if (groupTitles.includes(item.title)) {
                item.actionsSections = [];
                return;
            }

            item.actionsSections = [
                [
                    {
                        id: "zoom-to-layer",
                        title: "Zoom To",
                        icon: "zoom-to-object"
                    }
                ]
            ];

        };

        layerList.addEventListener(
            "arcgisTriggerAction",
            async (event) => {

                const { action, item } = event.detail;

                if (action.id !== "zoom-to-layer") {
                    return;
                }

                const layer = item.layer;

                await layer.load();

                if (layer.fullExtent) {

                    view.goTo({
                        target: layer.fullExtent,
                        tilt: 60
                    });

                }
            }
        );

        await buildingLayer.load();

        buildingLayer.allSublayers.forEach(function (sublayer) {
            const isOverview =
                sublayer.title === "Overview" ||
                sublayer.title === "ExteriorShell" ||
                sublayer.modelName === "Overview";

            const isFullModel =
                sublayer.title === "Full Model" ||
                sublayer.modelName === "FullModel";

            if (isOverview) {
                sublayer.visible = false;
                sublayer.listMode = "hide";
            }

            if (isFullModel) {
                sublayer.visible = true;
            }
        });

        if (buildingExplorer) {
            await buildingExplorer.componentOnReady();
            buildingExplorer.layers = [buildingLayer];
        }

        function updateBuildingExplorerButton() {
            if (!buildingExplorerExpand) {
                return;
            }

            const bimIsVisible =
                bimGroup.visible &&
                buildingLayer.visible;

            buildingExplorerExpand.style.display =
                bimIsVisible ? "block" : "none";

            if (!bimIsVisible) {
                buildingExplorerExpand.expanded = false;
            }
        }

        updateBuildingExplorerButton();

        buildingLayer.watch(
            "visible",
            updateBuildingExplorerButton
        );

        if (buildingLayer.fullExtent) {
            await view.goTo(
                {
                    target: buildingLayer.fullExtent.expand(1.15),
                    tilt: 55
                },
                {
                    duration: 1500
                }
            );
        }

        // Only allow one panel to be expanded at a time
        buildingExplorerExpand.addEventListener(
            "arcgisPropertyChange",
            () => {
                if (buildingExplorerExpand.expanded) {
                    layerListExpand.expanded = false;
                }
            }
        );

        layerListExpand.addEventListener(
            "arcgisPropertyChange",
            () => {
                if (layerListExpand.expanded) {
                    buildingExplorerExpand.expanded = false;
                }
            }
        );
    }

    initScene().catch((error) => {
        console.error("Failed to initialise the scene:", error);
    });

});