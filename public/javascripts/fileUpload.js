FilePond.registerPlugin(
    FilePondPluginImagePreview,
    FilePondPluginImageResize,
    FilePondPluginImagePreview,
    FilePondPluginFileEncode
);

FilePond.setOptions({
    stylePanelAspectRatio: 150/100,
    imageResizeTargerHeight: 150,
    imageResizeTargerWidth: 100
});

FilePond.parse(document.body);