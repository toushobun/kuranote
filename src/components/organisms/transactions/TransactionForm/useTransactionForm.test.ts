    );
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });

    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "1500",
      businessNetAmount: "0",
    });
    expect(result.current.signedTotalAmount).toBe("+1500");
    expect(result.current.businessTotalAmount).toBe("0");
  });

  it.each([